/** Production Netlify site (primary deploy). */
export const DEFAULT_SITE_URL = 'https://admirable-marzipan-f2cfa1.netlify.app'

/** GitHub Pages origin for this repository. */
export const GITHUB_PAGES_ORIGIN = 'https://jaeyeullee-a11y.github.io'

export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, '')
}

export function resolveSiteUrl(options: {
  siteUrl?: string
  viteBase?: string
  githubPagesOrigin?: string
  defaultSiteUrl?: string
}): string {
  if (options.siteUrl?.trim()) {
    return normalizeSiteUrl(options.siteUrl)
  }

  const base = options.viteBase?.trim() || '/'
  const origin = options.githubPagesOrigin ?? GITHUB_PAGES_ORIGIN
  if (base !== '/') {
    const normalizedBase = base.startsWith('/') ? base : `/${base}`
    return normalizeSiteUrl(`${origin}${normalizedBase}`)
  }

  return normalizeSiteUrl(options.defaultSiteUrl ?? DEFAULT_SITE_URL)
}

export function buildRobotsTxt(siteUrl: string): string {
  const base = normalizeSiteUrl(siteUrl)
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n')
}

export function buildSitemapXml(siteUrl: string, lastmod = '2026-07-20'): string {
  const base = normalizeSiteUrl(siteUrl)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${base}/</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n')
}
