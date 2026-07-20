import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SITE_URL,
  buildRobotsTxt,
  buildSitemapXml,
  resolveSiteUrl,
} from '../src/lib/seoFiles.ts'

const siteUrl = resolveSiteUrl({
  siteUrl: process.env.SITE_URL,
  viteBase: process.env.VITE_BASE,
  defaultSiteUrl: DEFAULT_SITE_URL,
})

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(rootDir, 'public')
fs.mkdirSync(publicDir, { recursive: true })

const robotsPath = path.join(publicDir, 'robots.txt')
const sitemapPath = path.join(publicDir, 'sitemap.xml')

fs.writeFileSync(robotsPath, buildRobotsTxt(siteUrl), 'utf8')
fs.writeFileSync(sitemapPath, buildSitemapXml(siteUrl), 'utf8')

console.log(`Wrote SEO files for ${siteUrl}`)
console.log(`  - ${path.relative(rootDir, robotsPath)}`)
console.log(`  - ${path.relative(rootDir, sitemapPath)}`)
