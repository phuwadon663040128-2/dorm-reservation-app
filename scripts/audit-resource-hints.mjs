import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { stripPrefetchLinks } from '../src/server/utils/resource-hints.ts'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000'
const outputPath = process.argv[3] ? resolve(process.argv[3]) : null
const routes = ['/', '/rooms', '/services/utilities']

const fixture = [
  '<link rel="prefetch" href="/later.js">',
  '<link rel="modulepreload" href="/current.js">',
  '<link rel="preload" as="style" href="/current.css">',
  '<link rel="preload" as="font" href="/current.woff2">',
  '<link rel="preload" as="image" href="/hero.webp">',
  '<link rel="stylesheet" href="/current.css">',
  '<img src="/hero.webp" fetchpriority="high">',
].join('')
const strippedFixture = stripPrefetchLinks(fixture)

const safetyFixture = {
  prefetchRemoved: !strippedFixture.includes('rel="prefetch"'),
  modulepreloadPreserved: strippedFixture.includes('rel="modulepreload"'),
  cssPreloadPreserved: strippedFixture.includes('as="style"'),
  fontPreloadPreserved: strippedFixture.includes('as="font"'),
  imagePreloadPreserved: strippedFixture.includes('as="image"'),
  stylesheetPreserved: strippedFixture.includes('rel="stylesheet"'),
  lcpImagePreserved: strippedFixture.includes('fetchpriority="high"'),
}

if (Object.values(safetyFixture).some(value => !value)) {
  throw new Error(`Resource-hint safety fixture failed: ${JSON.stringify(safetyFixture)}`)
}

function countLinks(html, rel, as = null) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].filter(([tag]) => {
    const relation = tag.match(/\brel=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)?.slice(1).find(Boolean)
    const resourceType = tag.match(/\bas=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)?.slice(1).find(Boolean)
    return relation?.split(/\s+/).includes(rel) && (as === null || resourceType === as)
  }).length
}

const pages = []
for (const route of routes) {
  const response = await fetch(new URL(route, baseUrl))
  if (!response.ok) throw new Error(`${route} returned ${response.status}`)
  const html = await response.text()
  pages.push({
    route,
    prefetch: countLinks(html, 'prefetch'),
    modulepreload: countLinks(html, 'modulepreload'),
    stylesheet: countLinks(html, 'stylesheet'),
    cssPreload: countLinks(html, 'preload', 'style'),
    fontPreload: countLinks(html, 'preload', 'font'),
    imagePreload: countLinks(html, 'preload', 'image'),
    fetchPriorityHighImages: (html.match(/<img\b[^>]*\bfetchpriority="high"[^>]*>/gi) ?? []).length,
    hasDescription: /<meta\b[^>]*\bname="description"[^>]*>/i.test(html),
  })
}

for (const page of pages) {
  if (page.prefetch !== 0) throw new Error(`${page.route} still emits rel=prefetch`)
  if (page.modulepreload === 0) throw new Error(`${page.route} lost modulepreload`)
  if (page.stylesheet === 0) throw new Error(`${page.route} lost its stylesheet`)
  if (!page.hasDescription) throw new Error(`${page.route} lost its meta description`)
}
if (pages[0].fetchPriorityHighImages === 0) {
  throw new Error('The home page lost its high-priority LCP image')
}

const result = { safetyFixture, pages }
console.log(JSON.stringify(result, null, 2))

if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  console.log(`Resource-hint report: ${outputPath}`)
}
