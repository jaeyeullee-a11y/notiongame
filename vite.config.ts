/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: Number(env.VITE_DEV_PORT) || 5173,
      open: false,
    },
    preview: {
      host: true,
      port: Number(env.VITE_PREVIEW_PORT) || 4173,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.ts'],
    },
  }
})
