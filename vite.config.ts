import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/frozen_rabbit_workshop/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
