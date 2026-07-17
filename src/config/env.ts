function readFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE || 'Runway Defense',
  env: import.meta.env.VITE_APP_ENV || 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  features: {
    vocSubmit: readFlag(import.meta.env.VITE_ENABLE_VOC_SUBMIT),
    playLog: readFlag(import.meta.env.VITE_ENABLE_PLAY_LOG),
  },
} as const

export type AppConfig = typeof appConfig
