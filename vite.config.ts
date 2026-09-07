import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { rmSync, writeFileSync } from 'node:fs'

const base = process.env.VITE_BASE_PATH || '/'
let outputDir = ''

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), {
    name: 'staging-search-metadata',
    apply: 'build',
    configResolved(config) { outputDir = resolve(config.root, config.build.outDir) },
    transformIndexHtml(html) {
      return base === '/staging/' ? html.replace('content="index, follow"', 'content="noindex, follow"') : html
    },
    closeBundle() {
      if (base !== '/staging/') return
      writeFileSync(resolve(outputDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
      rmSync(resolve(outputDir, 'sitemap.xml'), { force: true })
    }
  }],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**', '**/dist/**'],
  }
})
