import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const scope = process.argv[3] ?? 'all'
const requestedReportDirectory = process.argv[4]
const lighthouseVersion = process.env.LIGHTHOUSE_VERSION ?? '13.4.1'
const npx = 'npx'
const temporaryReportDirectory = !requestedReportDirectory
const reportDirectory = requestedReportDirectory
  ? resolve(requestedReportDirectory)
  : await mkdtemp(join(tmpdir(), 'dorm-lighthouse-'))
await mkdir(reportDirectory, { recursive: true })
const allCases = [
  { name: 'home-mobile', path: '/' },
  { name: 'rooms-mobile', path: '/rooms' },
  { name: 'services-mobile', path: '/services/utilities' },
  { name: 'home-desktop', path: '/', preset: 'desktop' },
  { name: 'rooms-desktop', path: '/rooms', preset: 'desktop' },
  { name: 'services-desktop', path: '/services/utilities', preset: 'desktop' },
]
const cases = scope === 'all'
  ? allCases
  : allCases.filter(auditCase => auditCase.name.startsWith(`${scope}-`))

if (cases.length === 0) {
  throw new Error(`Unknown Lighthouse scope: ${scope}`)
}

const results = []

try {
  for (const auditCase of cases) {
    const reportPath = join(reportDirectory, `${auditCase.name}.json`)
    const args = [
      '--yes',
      `lighthouse@${lighthouseVersion}`,
      `${baseUrl}${auditCase.path}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${reportPath}`,
      '--quiet',
      '--chrome-flags=--headless=new --disable-gpu --no-first-run --disable-extensions',
    ]
    if (auditCase.preset) args.push(`--preset=${auditCase.preset}`)

    const command = spawnSync(npx, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
      // Windows command shims are .cmd files and require the command shell.
      shell: process.platform === 'win32',
    })
    if (command.status !== 0) {
      throw new Error(
        `Lighthouse failed for ${auditCase.name}: ${command.error?.message ?? command.stderr}`,
      )
    }

    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    const audits = report.audits
    results.push({
      page: auditCase.name,
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories['best-practices'].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      fcpMs: Math.round(audits['first-contentful-paint'].numericValue),
      lcpMs: Math.round(audits['largest-contentful-paint'].numericValue),
      tbtMs: Math.round(audits['total-blocking-time'].numericValue),
      speedIndexMs: Math.round(audits['speed-index'].numericValue),
      cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      ttiMs: Math.round(audits.interactive.numericValue),
      transferredKB: Math.round(audits['total-byte-weight'].numericValue / 1024),
    })
  }

  console.table(results)
  console.log(JSON.stringify(results, null, 2))
} finally {
  if (temporaryReportDirectory) {
    await rm(reportDirectory, { recursive: true, force: true })
  } else {
    console.log(`Lighthouse JSON reports: ${reportDirectory}`)
  }
}
