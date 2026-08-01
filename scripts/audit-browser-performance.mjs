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
  const networkFailures = []
  const httpErrors = []

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
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
      networkFailures.push({
        url: message.params.url ?? message.params.requestId,
        errorText: message.params.errorText,
      })
    }
    if (
      message.method === 'Network.responseReceived'
      && message.params.response.status >= 400
      && message.params.response.url.startsWith(baseUrl)
    ) {
      httpErrors.push({
        url: message.params.response.url,
        status: message.params.response.status,
      })
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
    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        if (await evaluate(`Boolean(document.querySelector('#__nuxt')?.__vue_app__)`)) break
      } catch {
        // A development build can briefly replace the execution context while
        // compiling a route. Retry until the hydrated Nuxt app is interactive.
      }
      await sleep(25)
    }
    await sleep(200)
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
    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        const rendered = await evaluate(`location.pathname === ${JSON.stringify(expectedPath)}
          && Boolean(document.querySelector('#__nuxt main'))
          && Boolean(document.querySelector('#__nuxt')?.__vue_app__)`)
        if (rendered) break
      } catch {
        // Dev route compilation may replace the execution context briefly.
      }
      await sleep(25)
    }
    return evaluate(`({
      expectedPath: ${JSON.stringify(expectedPath)},
      actualPath: location.pathname,
      rendered: location.pathname === ${JSON.stringify(expectedPath)}
        && Boolean(document.querySelector('#__nuxt main')),
      sessionUser: sessionStorage.getItem('dorm-demo-session-user'),
    })`)
  }

  async function auditRequestedRoute(requestedPath, expectedPaths) {
    await navigate(requestedPath)
    const allowedPaths = Array.isArray(expectedPaths) ? expectedPaths : [expectedPaths]
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const ready = await evaluate(`(${JSON.stringify(allowedPaths)}).includes(location.pathname)
        && Boolean(document.querySelector('#__nuxt main'))`)
      if (ready) break
      await sleep(25)
    }
    return evaluate(`({
      requestedPath: ${JSON.stringify(requestedPath)},
      actualPath: location.pathname,
      query: location.search,
      expected: (${JSON.stringify(allowedPaths)}).includes(location.pathname),
      rendered: Boolean(document.querySelector('#__nuxt main')),
    })`)
  }

  async function auditRouteGroup(sessionUser, routes) {
    if (sessionUser) {
      await evaluate(`sessionStorage.setItem('dorm-demo-session-user', ${JSON.stringify(sessionUser)})`)
    } else {
      await evaluate(`sessionStorage.clear()`)
    }
    const results = []
    for (const [requestedPath, expectedPaths = requestedPath] of routes) {
      results.push(await auditRequestedRoute(requestedPath, expectedPaths))
    }
    return results
  }

  await Promise.all([
    call('Page.enable'),
    call('Runtime.enable'),
    call('Log.enable'),
    call('Performance.enable'),
    call('Network.enable'),
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
  const homeSearchControls = await evaluate(`(async () => {
    const triggers = [...document.querySelectorAll('[data-testid^="home-search-"]')]
    const configTrigger = document.querySelector('[data-testid="home-search-config"]')
    configTrigger.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    }))
    for (let attempt = 0; attempt < 100 && !document.querySelector('[data-slot="select-content"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    const content = document.querySelector('[data-slot="select-content"]')
    document.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    }))
    const items = [...(content?.querySelectorAll('[data-slot="select-item"]') ?? [])]
    const airconItem = items.find(item => item.textContent?.trim() === 'ห้องแอร์')
    airconItem?.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 2,
      pointerType: 'mouse',
    }))
    airconItem?.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 2,
      pointerType: 'mouse',
    }))
    await new Promise(resolve => setTimeout(resolve, 50))
    return {
      shadcnTriggers: triggers.length,
      nativeSelects: document.querySelectorAll('main select').length,
      chevrons: triggers.filter(trigger => trigger.querySelector('svg')).length,
      opened: Boolean(content),
      optionCount: items.length,
      selectedConfig: configTrigger.textContent?.trim() ?? '',
    }
  })()`)
  const contactNavigation = await timedClientNavigation(
    'home-to-contact',
    `document.querySelector('[data-testid="top-nav-contact"]').click()`,
    `location.pathname === '/contact'`,
  )
  await navigate('/')
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

  const unauthenticatedRoomLogin = await evaluate(`(async () => {
    document.querySelector('[data-testid="room-view-list"]').click()
    for (let attempt = 0; attempt < 100 && !document.querySelector('[data-testid="room-tile"][data-room-status="available"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    document.querySelector('[data-testid="room-tile"][data-room-status="available"]').click()
    for (let attempt = 0; attempt < 200 && !document.querySelector('[data-testid="login-form"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    const query = new URLSearchParams(location.search)
    return {
      loginModalOpened: Boolean(document.querySelector('[data-testid="login-form"]')),
      roomDetailClosed: !document.querySelector('[data-testid="public-room-detail"]'),
      auth: query.get('auth'),
      redirect: query.get('redirect'),
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

  await evaluate(`sessionStorage.setItem('dorm-demo-session-user', 'applicant-a')`)
  await navigate('/app/application/camp-2569')
  const applicationValidationLayout = await evaluate(`(async () => {
    const pinia = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$pinia
    const application = pinia?._s?.get('application')
    const beganRevision = application?.beginRevision() === true
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const form = document.querySelector('form.min-w-0')
    const nextButton = () => [...(form?.querySelectorAll('button') ?? [])].at(-1)
    nextButton()?.click()
    for (let attempt = 0; attempt < 200 && !document.querySelector('#first-name'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }

    const firstName = document.querySelector('#first-name')
    const beforeGroups = [...document.querySelectorAll('form.min-w-0 [data-slot="field-group"]')]
      .map(group => group.getBoundingClientRect().height)
    if (firstName) {
      firstName.value = ''
      firstName.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await Promise.resolve()
    nextButton()?.click()
    for (let attempt = 0; attempt < 200 && !document.querySelector('#first-name[aria-invalid="true"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const groups = [...document.querySelectorAll('form.min-w-0 [data-slot="field-group"]')]
    const afterGroups = groups.map(group => group.getBoundingClientRect().height)
    const controls = [...document.querySelectorAll('form.min-w-0 input, form.min-w-0 textarea, form.min-w-0 [role="combobox"]')]
    return {
      beganRevision,
      path: location.pathname,
      invalidFieldVisible: Boolean(firstName && firstName.getBoundingClientRect().height > 0),
      validationRendered: firstName?.getAttribute('aria-invalid') === 'true',
      visibleGroups: afterGroups.filter(height => height > 0).length,
      groupCount: groups.length,
      beforeGroups,
      afterGroups,
      controlCount: controls.length,
      visibleControls: controls.filter(control => control.getBoundingClientRect().height > 0).length,
    }
  })()`)

  await evaluate(`sessionStorage.clear()`)
  await navigate('/contact')
  const contactValidationLayout = await evaluate(`(async () => {
    const setValue = (selector, value) => {
      const element = document.querySelector(selector)
      if (!element) return false
      element.value = value
      element.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    }
    setValue('#ct-name', 'Regression Test')
    setValue('#ct-email', 'invalid-email')
    setValue('#ct-subject', 'Validation layout')
    await Promise.resolve()
    const contactForm = document.querySelector('#contact-form')
    if (contactForm) contactForm.noValidate = true
    document.querySelector('#contact-form button[type="submit"]')?.click()
    for (let attempt = 0; attempt < 200 && !document.querySelector('#ct-email[aria-invalid="true"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const group = document.querySelector('#contact-form [data-slot="field-group"]')
    const controls = [...document.querySelectorAll('#contact-form input, #contact-form textarea, #contact-form button')]
    return {
      validationRendered: document.querySelector('#ct-email')?.getAttribute('aria-invalid') === 'true',
      groupHeight: group?.getBoundingClientRect().height ?? 0,
      controlCount: controls.length,
      visibleControls: controls.filter(control => control.getBoundingClientRect().height > 0).length,
    }
  })()`)

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

  const publicRouteAudit = await auditRouteGroup(null, [
    ['/', '/'],
    ['/campaigns/camp-2569', '/campaigns/camp-2569'],
    ['/rooms', '/rooms'],
    ['/announcements', '/announcements'],
    ['/personnel', '/personnel'],
    ['/guide', '/guide'],
    ['/services', '/services'],
    ['/services/utilities', '/services/utilities'],
    ['/services/maintenance', '/services/maintenance'],
    ['/services/parcel', '/services/parcel'],
    ['/info/rules', '/info/rules'],
    ['/info/fees', '/info/fees'],
    ['/info/floor-plans', '/info/floor-plans'],
    ['/info/units', '/info/units'],
    ['/contact', '/contact'],
    ['/login', '/'],
    ['/register?email=test@example.test', '/'],
    ['/verify-email?email=test@example.test', '/'],
  ])
  const applicantRouteAudit = await auditRouteGroup('applicant-i', [
    ['/app', '/app/rooms'],
    ['/app/campaigns', '/app/campaigns'],
    ['/app/application/camp-2569', ['/app/rooms', '/app/payments', '/app/roommate', '/app/application/camp-2569']],
    ['/app/rooms', '/app/rooms'],
    ['/app/roommate', '/app/roommate'],
    ['/app/reservation', '/app/reservation'],
    ['/app/payments', '/app/payments'],
    ['/app/contracts', '/app/contracts'],
    ['/app/next-steps', '/app/next-steps'],
    ['/app/renewal', '/app/renewal'],
    ['/app/account', '/app/rooms'],
  ])
  const staffRouteAudit = await auditRouteGroup('staff-admin', [
    ['/staff', '/staff'],
    ['/staff/campaigns', '/staff/campaigns'],
    ['/staff/rooms', '/staff/rooms'],
    ['/staff/applicants', '/staff/applicants'],
    ['/staff/groups', '/staff/groups'],
    ['/staff/holds', '/staff/holds'],
    ['/staff/reservations/manual', '/staff/reservations/manual'],
    ['/staff/obligations', '/staff/obligations'],
    ['/staff/scb/export', '/staff/scb/export'],
    ['/staff/scb/pdf-import', '/staff/scb/pdf-import'],
    ['/staff/scb/results', '/staff/scb/results'],
    ['/staff/contracts', '/staff/contracts'],
    ['/staff/key-handover', '/staff/key-handover'],
    ['/staff/handoff', '/staff/handoff'],
    ['/staff/reports', '/staff/reports'],
    ['/staff/audit', '/staff/audit'],
    ['/staff/settings', '/staff/settings'],
    ['/staff/access', '/staff/access'],
  ])
  const migrationRoutes = [...publicRouteAudit, ...applicantRouteAudit, ...staffRouteAudit]

  await evaluate(`sessionStorage.setItem('dorm-demo-session-user', 'applicant-i')`)
  const applicantBlockedFromStaff = await auditRequestedRoute('/staff', '/app/rooms')
  await evaluate(`sessionStorage.setItem('dorm-demo-session-user', 'staff-admin')`)
  const staffBlockedFromApplicant = await auditRequestedRoute('/app', '/staff')
  await evaluate(`sessionStorage.clear()`)
  const consoleCountBeforeExpected404 = consoleItems.length
  const networkFailureCountBeforeExpected404 = networkFailures.length
  const httpErrorCountBeforeExpected404 = httpErrors.length
  const unknownRouteRedirect = await auditRequestedRoute('/route-that-does-not-exist', '/')
  // A static host correctly responds 404 before the generated Nuxt fallback
  // redirects this intentionally unknown route. Do not mix that expected probe
  // into the diagnostics for the real application routes above.
  consoleItems.splice(consoleCountBeforeExpected404)
  networkFailures.splice(networkFailureCountBeforeExpected404)
  httpErrors.splice(httpErrorCountBeforeExpected404)
  const routeGuardParity = {
    applicantBlockedFromStaff,
    staffBlockedFromApplicant,
    unknownRouteRedirect,
  }

  await setViewport(390, 844, true)
  await evaluate(`sessionStorage.clear()`)
  await navigate('/rooms?dorm=dorm-8-lang')
  const mobileLShapeLegend = await evaluate(`(async () => {
    document.querySelector('[data-testid="room-view-plan"]')?.click()
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const legend = document.querySelector('[data-testid="plan-room-type-legend"]')
      if (legend && getComputedStyle(legend).opacity === '1') break
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    const legend = document.querySelector('[data-testid="plan-room-type-legend"]')
    const card = legend?.parentElement
    if (!legend || !card) return { rendered: false }
    const legendRect = legend.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const roomRects = [...card.querySelectorAll('button[title^="ห้อง "]')]
      .map(room => room.getBoundingClientRect())
    const overlappingRooms = roomRects.filter(rect => !(
      legendRect.right <= rect.left
      || legendRect.left >= rect.right
      || legendRect.bottom <= rect.top
      || legendRect.top >= rect.bottom
    )).length
    return {
      rendered: true,
      placement: legend.dataset.placement,
      leftHalf: legendRect.left + legendRect.width / 2 < cardRect.left + cardRect.width / 2,
      overlappingRooms,
      leftPx: +(legendRect.left - cardRect.left).toFixed(1),
      topPx: +(legendRect.top - cardRect.top).toFixed(1),
    }
  })()`)

  await navigate('/')
  const mobileHome = await metrics('mobile-home')
  const mobileNavigation = await evaluate(`(async () => {
    document.querySelector('button[aria-label="เปิดเมนูเว็บไซต์หอพัก"]')?.click()
    for (let attempt = 0; attempt < 200 && !document.querySelector('nav[aria-label="เมนูเว็บไซต์หอพักบนมือถือ"]'); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    const mobileNav = document.querySelector('nav[aria-label="เมนูเว็บไซต์หอพักบนมือถือ"]')
    const contact = [...(mobileNav?.querySelectorAll('button') ?? [])]
      .find(button => button.textContent?.trim() === 'ติดต่อ')
    contact?.click()
    for (let attempt = 0; attempt < 200 && location.pathname !== '/contact'; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    return {
      drawerOpened: Boolean(mobileNav),
      contactFound: Boolean(contact),
      path: location.pathname,
    }
  })()`)
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
    mobileLShapeLegend,
    mobileNavigation,
    desktopRooms,
    homeSearchControls,
    contactNavigation,
    dropdown,
    serviceText,
    roomViews,
    unauthenticatedRoomLogin,
    clientNavigation: [
      contactNavigation,
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
    applicationValidationLayout,
    contactValidationLayout,
    staffRefresh,
    migrationRoutes,
    routeGuardParity,
    hydrationProblems,
    severeConsole,
    exceptions,
    networkFailures,
    httpErrors,
  }
  console.log(JSON.stringify(result, null, 2))
  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
    console.log(`Browser regression report: ${outputPath}`)
  }
  socket.close()

  const behaviorPassed = dropdown.opened
    && homeSearchControls.shadcnTriggers === 3
    && homeSearchControls.nativeSelects === 0
    && homeSearchControls.chevrons === 3
    && homeSearchControls.opened
    && homeSearchControls.optionCount === 4
    && homeSearchControls.selectedConfig === 'ห้องแอร์'
    && contactNavigation.to === '/contact'
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
    && mobileLShapeLegend.rendered
    && mobileLShapeLegend.placement === 'overlay-auto'
    && mobileLShapeLegend.leftHalf
    && mobileLShapeLegend.overlappingRooms === 0
    && mobileNavigation.drawerOpened
    && mobileNavigation.contactFound
    && mobileNavigation.path === '/contact'
    && unauthenticatedRoomLogin.loginModalOpened
    && unauthenticatedRoomLogin.roomDetailClosed
    && unauthenticatedRoomLogin.auth === 'login'
    && unauthenticatedRoomLogin.redirect?.startsWith('/app/rooms')
    && applicantSession.user === 'applicant-i'
    && applicantSession.path.startsWith('/app')
    && applicantRefresh.rendered
    && applicantRefresh.sessionUser === 'applicant-i'
    && applicationValidationLayout.beganRevision
    && applicationValidationLayout.path === '/app/application/camp-2569'
    && applicationValidationLayout.validationRendered
    && applicationValidationLayout.invalidFieldVisible
    && applicationValidationLayout.groupCount === 3
    && applicationValidationLayout.visibleGroups === applicationValidationLayout.groupCount
    && applicationValidationLayout.controlCount >= 19
    && applicationValidationLayout.visibleControls === applicationValidationLayout.controlCount
    && contactValidationLayout.validationRendered
    && contactValidationLayout.groupHeight > 0
    && contactValidationLayout.controlCount === contactValidationLayout.visibleControls
    && staffRefresh.rendered
    && staffRefresh.sessionUser === 'staff-admin'
    && migrationRoutes.every(route => route.expected && route.rendered)
    && Object.values(routeGuardParity).every(route => route.expected && route.rendered)
    && severeConsole.length === 0
    && hydrationProblems.length === 0
    && exceptions.length === 0
    && networkFailures.length === 0
    && httpErrors.length === 0
  if (!behaviorPassed) process.exitCode = 1
} finally {
  stopBrowser()
  await rm(profilePath, { recursive: true, force: true }).catch(() => {})
}
