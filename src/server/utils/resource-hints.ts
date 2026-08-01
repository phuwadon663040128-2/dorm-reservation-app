export const prefetchTag = /<link\b(?=[^>]*\brel=(?:"prefetch"|'prefetch'))[^>]*>/gi

export function stripPrefetchLinks(html: string) {
  return html.replace(prefetchTag, '')
}
