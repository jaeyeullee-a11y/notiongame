/// <reference types="vitest/config" />
import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Copy index.html so /workshop works on static hosts without SPA rewrites. */
function workshopStaticFallback(): Plugin {
  return {
    name: 'workshop-static-fallback',
    closeBundle() {
      const index = path.resolve('dist/index.html')
      mkdirSync(path.resolve('dist/workshop'), { recursive: true })
      copyFileSync(index, path.resolve('dist/workshop/index.html'))
      copyFileSync(index, path.resolve('dist/404.html'))
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), workshopStaticFallback()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})

