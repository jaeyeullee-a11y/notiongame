import { useEffect } from 'react'
import type { ColorTheme } from '@/schemas/garden'
import { useGardenStore } from '@/stores/gardenStore'

export const COLOR_THEME_STORAGE_KEY = 'stillgarden:colorTheme'

export function resolveTheme(
  colorTheme: ColorTheme,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (colorTheme === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return colorTheme
}

export function readStoredColorTheme(): ColorTheme | null {
  try {
    const value = localStorage.getItem(COLOR_THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value
    }
  } catch {
    // Ignore quota / privacy mode failures.
  }
  return null
}

export function writeStoredColorTheme(colorTheme: ColorTheme): void {
  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme)
  } catch {
    // Ignore quota / privacy mode failures.
  }
}

export function useTheme(): void {
  const colorTheme = useGardenStore((s) => s.settings.colorTheme)

  // Seed from localStorage before a save slot restores settings (guest / first visit).
  useEffect(() => {
    const stored = readStoredColorTheme()
    if (!stored) return
    const state = useGardenStore.getState()
    if (state.settings.colorTheme === 'system' && stored !== 'system') {
      useGardenStore.setState({
        settings: { ...state.settings, colorTheme: stored },
      })
    }
  }, [])

  useEffect(() => {
    writeStoredColorTheme(colorTheme)
  }, [colorTheme])

  useEffect(() => {
    const media =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null

    const apply = () => {
      const prefersDark = media?.matches ?? false
      document.documentElement.dataset.theme = resolveTheme(colorTheme, prefersDark)
    }

    apply()

    if (colorTheme !== 'system' || !media) {
      return
    }

    const onChange = () => apply()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [colorTheme])
}
