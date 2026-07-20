import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SITE_URL,
  GITHUB_PAGES_ORIGIN,
  buildRobotsTxt,
  buildSitemapXml,
  normalizeSiteUrl,
  resolveSiteUrl,
} from '@/lib/seoFiles'

describe('seoFiles', () => {
  it('strips trailing slashes from site URLs', () => {
    expect(normalizeSiteUrl('https://example.com/')).toBe('https://example.com')
    expect(normalizeSiteUrl('https://example.com/path///')).toBe('https://example.com/path')
  })

  it('prefers explicit SITE_URL', () => {
    expect(
      resolveSiteUrl({
        siteUrl: 'https://custom.example/',
        viteBase: '/notiongame/',
        defaultSiteUrl: DEFAULT_SITE_URL,
      }),
    ).toBe('https://custom.example')
  })

  it('derives GitHub Pages URL from VITE_BASE', () => {
    expect(
      resolveSiteUrl({
        viteBase: '/notiongame/',
        githubPagesOrigin: GITHUB_PAGES_ORIGIN,
      }),
    ).toBe(`${GITHUB_PAGES_ORIGIN}/notiongame`)
  })

  it('falls back to the Netlify production URL', () => {
    expect(resolveSiteUrl({ viteBase: '/' })).toBe(DEFAULT_SITE_URL)
  })

  it('builds robots.txt with Sitemap directive', () => {
    expect(buildRobotsTxt(DEFAULT_SITE_URL)).toBe(
      ['User-agent: *', 'Allow: /', '', `Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`, ''].join('\n'),
    )
  })

  it('builds a single-page sitemap for the site root', () => {
    const xml = buildSitemapXml(DEFAULT_SITE_URL, '2026-07-20')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(`<loc>${DEFAULT_SITE_URL}/</loc>`)
    expect(xml).toContain('<lastmod>2026-07-20</lastmod>')
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
  })
})
