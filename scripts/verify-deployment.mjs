import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.argv[2] || 'dist')
const base = process.env.VITE_BASE_PATH || '/'
assert.ok(['/', '/staging/'].includes(base), `Unexpected deployment base: ${base}`)
const origin = 'https://workshop.frozenrabbit.com'
const html = readFileSync(path.join(dir, 'index.html'), 'utf8')
assert.ok(html.includes(`rel="canonical" href="${origin}/"`))
assert.ok(!html.includes('emu-rabbit.github.io/frozen_rabbit_workshop'))
assert.ok(!html.includes('%BASE_URL%'))
assert.ok(html.includes(`href="${base}logo.png"`))
assert.ok(html.includes(`content="${base === '/' ? 'index' : 'noindex'}, follow"`))
for (const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"]+)"/g)) {
  assert.ok(match[1].startsWith(base), `Wrong asset base: ${match[1]}`)
  assert.ok(existsSync(path.join(dir, match[1].slice(base.length))), `Missing asset: ${match[1]}`)
}
for (const tag of ['og:url', 'og:image', 'og:image:secure_url', 'twitter:image']) {
  assert.ok(new RegExp(`(?:property|name)="${tag}" content="${origin}/`).test(html), `Wrong ${tag}`)
}
for (const match of html.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)) assert.equal(match[1], `${origin}/`)
const robots = readFileSync(path.join(dir, 'robots.txt'), 'utf8')
if (base === '/') {
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
  const sitemap = readFileSync(path.join(dir, 'sitemap.xml'), 'utf8')
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`))
  assert.ok(!sitemap.includes('github.io'))
} else {
  assert.ok(robots.includes('Disallow: /'))
  assert.ok(!existsSync(path.join(dir, 'sitemap.xml')))
}
assert.ok(existsSync(path.join(dir, 'og-cover.jpg')))
// Validate same-site game packages from the built manifest, including their content hashes.
const { createHash } = await import('node:crypto')
const manifest = JSON.parse(readFileSync(path.join(dir, 'game-data/manifest.json'), 'utf8'))
for (const bundle of Object.values(manifest.bundles)) {
  const bytes = readFileSync(path.join(dir, 'game-data', bundle.file))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256)
}
console.log(`Deployment artifact verified: ${base} (${dir})`)
