/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  readonly VITE_DEV_PORT?: string
  readonly VITE_PREVIEW_PORT?: string
  readonly VITE_ENABLE_VOC_SUBMIT: string
  readonly VITE_ENABLE_PLAY_LOG: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
