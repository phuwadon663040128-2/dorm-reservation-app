import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const reportRoot = resolve(process.argv[2] ?? 'reports/lighthouse')
const outputPath = resolve(process.argv[3] ?? join(reportRoot, 'summary.json'))
const cases = [
  'home-mobile',
  'rooms-mobile',
  'services-mobile',
  'home-desktop',
  'rooms-desktop',
  'services-desktop',
]

async function readReport(stage, name) {
  return JSON.parse(await readFile(join(reportRoot, stage, `${name}.json`), 'utf8'))
}

function metrics(report) {
  const audits = report.audits
  return {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories['best-practices'].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
    fcpMs: Math.round(audits['first-contentful-paint'].numericValue),
    lcpMs: Math.round(audits['largest-contentful-paint'].numericValue),
    tbtMs: Math.round(audits['total-blocking-time'].numericValue),
    cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    transferredKB: Math.round(audits['total-byte-weight'].numericValue / 1024),
  }
}

const comparison = []
for (const name of cases) {
  const before = metrics(await readReport('before', name))
  const after = metrics(await readReport('after', name))
  comparison.push({
    page: name,
    before,
    after,
    delta: {
      performance: after.performance - before.performance,
      seo: after.seo - before.seo,
      lcpMs: after.lcpMs - before.lcpMs,
      tbtMs: after.tbtMs - before.tbtMs,
      transferredKB: after.transferredKB - before.transferredKB,
    },
  })
}

const rooms = await readReport('after', 'rooms-mobile')
const audits = rooms.audits
const lcpItems = audits['lcp-breakdown-insight']?.details?.items ?? []
const lcpNode = lcpItems.find(item => item.type === 'node')
const resources = (audits['resource-summary']?.details?.items ?? []).map(item => ({
  type: item.resourceType,
  requests: item.requestCount,
  bytes: item.transferSize,
  kb: Number((item.transferSize / 1024).toFixed(1)),
}))
const slowestRequests = (audits['network-requests']?.details?.items ?? [])
  .map(item => ({
    url: item.url,
    type: item.resourceType,
    durationMs: Number((item.networkEndTime - item.networkRequestTime).toFixed(1)),
    bytes: item.transferSize,
  }))
  .sort((left, right) => right.durationMs - left.durationMs)
  .slice(0, 10)

const result = {
  generatedAt: new Date().toISOString(),
  comparison,
  roomsMobile: {
    ...metrics(rooms),
    lcpElement: {
      selector: lcpNode?.selector ?? null,
      label: lcpNode?.nodeLabel ?? null,
      snippet: lcpNode?.snippet ?? null,
    },
    payload: resources,
    slowestRequests,
  },
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(result, null, 2))
console.log(`Lighthouse summary: ${outputPath}`)
