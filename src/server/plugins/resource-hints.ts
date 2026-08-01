import { stripPrefetchLinks } from '../utils/resource-hints'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // Nitro includes every dynamic chunk from the build manifest as a prefetch
    // hint during generation. On this route-heavy mock-up that made a first
    // visit compete with 80+ scripts and unrelated images. Keep current-route
    // modulepreloads, but let later routes load their chunks on demand.
    html.head = html.head.map(stripPrefetchLinks)
  })
})
