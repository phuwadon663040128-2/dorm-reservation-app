import { spawn, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const outputPath = process.argv[3] ? resolve(process.argv[3]) : null
const cdpPort = Number(process.env.CDP_PORT ?? 9226)
const edgePath = process.env.EDGE_PATH
  ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profilePath = await mkdtemp(join(tmpdir(), 'dorm-performance-audit-'))
const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  `--user-data-dir=${profilePath}`,
  `--remote-debugging-port=${cdpPort}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true })

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function waitForBrowser() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`)
      if (response.ok) return response.json()
    } catch {}
    await sleep(250)
  }
  throw new Error('Microsoft Edge remote debugging did not become ready')
}

function stopBrowser() {
  if (!browser.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
  } else {
    browser.kill('SIGKILL')
  }
}

try {
  const targets = await waitForBrowser()
  const target = targets.find(candidate => candidate.type === 'page')
  if (!target) throw new Error('No Edge page target was found')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })

  let sequence = 0
  const pending = new Map()
  const listeners = new Map()
  const consoleItems = []
  const exceptions = []

  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id)
      if (message.error) request.reject(message.error)
      else request.resolve(message.result)
      return
    }

    if (message.method === 'Runtime.consoleAPICalled') {
      consoleItems.push({
        type: message.params.type,
        text: message.params.args
          .map(argument => argument.value ?? argument.description ?? '')
          .join(' '),
      })
    }
    if (message.method === 'Log.entryAdded') {
      consoleItems.push({
        type: message.params.entry.level,
        text: message.params.entry.text,
      })
    }
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.text)
    }
    for (const listener of listeners.get(message.method) ?? []) {
      listener(message.params)
    }
  }

  function call(method, params = {}) {
    const id = ++sequence
    socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
  }

  function once(event) {
    return new Promise((resolve) => {
      const listener = (params) => {
        listeners.set(event, (listeners.get(event) ?? []).filter(item => item !== listener))
        resolve(params)
      }
      listeners.set(event, [...(listeners.get(event) ?? []), listener])
    })
  }

  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result.value
  }

  async function setViewport(width, height, mobile = false) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    })
  }

  async function navigate(path) {
    const loaded = once('Page.loadEventFired')
    await call('Page.navigate', { url: `${baseUrl}${path}` })
    await loaded
    await sleep(2_200)
  }

  async function metrics(label) {
    return evaluate(`(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      const paints = Object.fromEntries(
        performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime]),
      )
      const scripts = performance.getEntriesByType('resource').filter(entry =>
        entry.name.includes('/_nuxt/') && entry.name.split('?')[0].endsWith('.js'),
      )
      return {
        label: ${JSON.stringify(label)},
        path: location.pathname,
        ttfb: +navigation.responseStart.toFixed(1),
        responseEnd: +navigation.responseEnd.toFixed(1),
        domContentLoaded: +navigation.domContentLoadedEventEnd.toFixed(1),
        load: +navigation.loadEventEnd.toFixed(1),
        fcp: +(paints['first-contentful-paint'] ?? 0).toFixed(1),
        lcp: +(window.__dormAudit?.lcp ?? 0).toFixed(1),
        vueReady: +(window.__dormAudit?.vueReady ?? 0).toFixed(1),
        clientReadyStart: 'NavigationTiming.responseEnd',
        clientReadyEnd: '#__nuxt.__vue_app__ observed after Vue mount',
        clientReadyAfterHtml: +Math.max(
          0,
          (window.__dormAudit?.vueReady ?? 0) - navigation.responseEnd,
        ).toFixed(1),
        jsRequests: scripts.length,
        jsTransferKB: +(scripts.reduce((sum, entry) => sum + entry.transferSize, 0) / 1024).toFixed(1),
      }
    })()`)
  }

  async function timedClientNavigation(label, clickAction, readyExpression) {
    return evaluate(`(async () => {
      const from = location.pathname + location.search
      const start = performance.now();
      ${clickAction}
      for (let attempt = 0; attempt < 500 && !(${readyExpression}); attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      if (!(${readyExpression})) throw new Error('Timed out waiting for ${label}')
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const end = performance.now()
      const chunks = performance.getEntriesByType('resource').filter(entry =>
        entry.startTime >= start - 1
        && entry.name.includes('/_nuxt/')
        && entry.name.split('?')[0].endsWith('.js')
      )
      return {
        label: ${JSON.stringify(label)},
        from,
        to: location.pathname + location.search,
        clickToRenderedMs: +(end - start).toFixed(1),
        jsChunks: new Set(chunks.map(entry => entry.name)).size,
        jsTransferKB: +(chunks.reduce((sum, entry) => sum + entry.transferSize, 0) / 1024).toFixed(1),
      }
    })()`)
  }

  async function reloadAndVerify(expectedPath) {
    const loaded = once('Page.loadEventFired')
    await call('Page.reload')
    await loaded
    await sleep(750)
    return evaluate(`({
      expectedPath: ${JSON.stringify(expectedPath)},
      actualPath: location.pathname,
      rendered: location.pathname === ${JSON.stringify(expectedPath)}
        && Boolean(document.querySelector('#__nuxt main')),
      sessionUser: sessionStorage.getItem('dorm-demo-session-user'),
    })`)
  }

  await Promise.all([
    call('Page.enable'),
    call('Runtime.enable'),
    call('Log.enable'),
    call('Performance.enable'),
  ])
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      window.__dormAudit = { vueReady: 0, lcp: 0 }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__dormAudit.lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      } catch {}
      // The start comes from Navigation Timing responseEnd. The end is the
      // first task after Vue exposes its mounted app on Nuxt's root element.
      // This includes module download/parse/execute plus hydration; it is a
      // client-ready window, not a framework-only hydration duration.
      const timer = setInterval(() => {
        const root = document.querySelector('#__nuxt')
        if (root?.__vue_app__) {
          window.__dormAudit.vueReady = performance.now()
          clearInterval(timer)
        }
      }, 0)
    })()`,
  })

  await setViewport(1_600, 1_000)
  await navigate('/')
  await evaluate(`sessionStorage.clear()`)
  const desktopHome = await metrics('desktop-home')
  const dropdown = await evaluate(`(async () => {
    const [dormMenu, serviceMenu] = document.querySelectorAll('details[data-header-dropdown]')
    serviceMenu.querySelector('summary').click()
    const opened = serviceMenu.open
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 20))
    const closedWithEscape = !serviceMenu.open
    dormMenu.querySelector('summary').click()
    serviceMenu.querySelector('summary').click()
    await new Promise(resolve => setTimeout(resolve, 20))
    const closedWhenAnotherOpens = !dormMenu.open && serviceMenu.open
    document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 20))
    const closedOutside = !serviceMenu.open
    serviceMenu.querySelector('summary').click()
    const utilities = serviceMenu.querySelector('button')
    utilities.click()
    for (let attempt = 0; attempt < 100 && location.pathname !== '/services/utilities'; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    return {
      opened,
      closedWithEscape,
      closedWhenAnotherOpens,
      closedOutside,
      closedAfterNavigate: ![...document.querySelectorAll('details[data-header-dropdown]')]
        .some(element => element.open),
      path: location.pathname,
    }
  })()`)

  await navigate('/services/utilities')
  const desktopServices = await metrics('desktop-services')
  const serviceText = await evaluate(`(() => {
    const text = document.querySelector('main')?.innerText ?? ''
    return {
      hasUtilities: text.includes('ค่าน้ำ ค่าไฟ'),
      hasMaintenance: text.includes('แจ้งซ่อม'),
      hasParcel: text.includes('แจ้งรับพัสดุ ไปรษณีย์'),
      hasSpareKey: text.includes('กุญแจสำรอง'),
      hasResidential: text.includes('นักศึกษาต่างชาติ'),
      hasHouseRegistration: text.includes('ย้ายทะเบียนบ้าน'),
    }
  })()`)

  await navigate('/')
  const homeToRooms = await timedClientNavigation(
    'home-to-rooms',
    `document.querySelector('main a[href="/rooms"]').click()`,
    `location.pathname === '/rooms'
      && Boolean(document.querySelector('[data-testid="room-view-plan"]'))`,
  )
  const roomsToDorm = await timedClientNavigation(
    'rooms-to-dorm-detail',
    `(() => {
      const dormMenu = document.querySelectorAll('details[data-header-dropdown]')[0]
      dormMenu.querySelector('summary').click()
      dormMenu.querySelector('button').click()
    })()`,
    `location.pathname === '/rooms'
      && new URLSearchParams(location.search).get('dorm') === 'dorm-8-lang'`,
  )

  const desktopRooms = await metrics('desktop-rooms')
  const roomViews = await evaluate(`(async () => {
    const planButton = document.querySelector('[data-testid="room-view-plan"]')
    const threeButton = document.querySelector('[data-testid="room-view-3d"]')
    const defaultPlan = planButton?.dataset.state === 'on' && !document.querySelector('canvas')
    threeButton.click()
    for (let attempt = 0; attempt < 500 && !document.querySelector('canvas'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    return {
      defaultPlan,
      threeDimensionalLoadedOnDemand: Boolean(document.querySelector('canvas')),
    }
  })()`)

  await navigate('/')
  await evaluate(`sessionStorage.clear()`)
  const loginModalOpen = await timedClientNavigation(
    'open-login-modal',
    `document.querySelector('[data-testid="login-open"]').click()`,
    `Boolean(document.querySelector('[data-testid="login-form"]'))`,
  )
  const loginToApp = await timedClientNavigation(
    'login-to-app',
    `document.querySelector('[data-testid="login-submit"]').click()`,
    `location.pathname.startsWith('/app') && Boolean(document.querySelector('#__nuxt main'))`,
  )
  const applicantSession = await evaluate(`({
    user: sessionStorage.getItem('dorm-demo-session-user'),
    path: location.pathname,
    loggedIn: Boolean(document.querySelector('header')),
  })`)
  const applicantRefresh = await reloadAndVerify(loginToApp.to.split('?')[0])

  await evaluate(`sessionStorage.setItem('dorm-demo-session-user', 'staff-admin')`)
  await navigate('/staff')
  const staffRefresh = await reloadAndVerify('/staff')
  const staffToCampaigns = await timedClientNavigation(
    'staff-to-campaigns',
    `document.querySelector('a[href="/staff/campaigns"]').click()`,
    `location.pathname === '/staff/campaigns'`,
  )
  const staffToRooms = await timedClientNavigation(
    'staff-to-rooms',
    `document.querySelector('a[href="/staff/rooms"]').click()`,
    `location.pathname === '/staff/rooms'`,
  )
  const staffToObligations = await timedClientNavigation(
    'staff-to-obligations',
    `document.querySelector('a[href="/staff/obligations"]').click()`,
    `location.pathname === '/staff/obligations'`,
  )

  await setViewport(390, 844, true)
  await evaluate(`sessionStorage.clear()`)
  await navigate('/')
  const mobileHome = await metrics('mobile-home')
  const hydrationProblems = consoleItems.filter(item =>
    /hydration|mismatch|hydrate/i.test(item.text),
  )
  const severeConsole = consoleItems.filter(item =>
    item.type === 'error',
  )

  const result = {
    desktopHome,
    desktopServices,
    mobileHome,
    desktopRooms,
    dropdown,
    serviceText,
    roomViews,
    clientNavigation: [
      homeToRooms,
      roomsToDorm,
      loginModalOpen,
      loginToApp,
      staffToCampaigns,
      staffToRooms,
      staffToObligations,
    ],
    applicantSession,
    applicantRefresh,
    staffRefresh,
    hydrationProblems,
    severeConsole,
    exceptions,
  }
  console.log(JSON.stringify(result, null, 2))
  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
    console.log(`Browser regression report: ${outputPath}`)
  }
  socket.close()

  const behaviorPassed = dropdown.opened
    && dropdown.closedWithEscape
    && dropdown.closedWhenAnotherOpens
    && dropdown.closedOutside
    && dropdown.closedAfterNavigate
    && dropdown.path === '/services/utilities'
    && serviceText.hasUtilities
    && serviceText.hasMaintenance
    && serviceText.hasParcel
    && !serviceText.hasSpareKey
    && !serviceText.hasResidential
    && !serviceText.hasHouseRegistration
    && roomViews.defaultPlan
    && roomViews.threeDimensionalLoadedOnDemand
    && applicantSession.user === 'applicant-i'
    && applicantSession.path.startsWith('/app')
    && applicantRefresh.rendered
    && applicantRefresh.sessionUser === 'applicant-i'
    && staffRefresh.rendered
    && staffRefresh.sessionUser === 'staff-admin'
    && severeConsole.length === 0
    && hydrationProblems.length === 0
    && exceptions.length === 0
  if (!behaviorPassed) process.exitCode = 1
} finally {
  stopBrowser()
  await rm(profilePath, { recursive: true, force: true }).catch(() => {})
}
