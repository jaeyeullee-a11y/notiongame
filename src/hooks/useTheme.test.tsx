import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COLOR_THEME_STORAGE_KEY,
  resolveTheme,
  useTheme,
} from '@/hooks/useTheme'
import { useGardenStore } from '@/stores/gardenStore'

function ThemeHost() {
  useTheme()
  return null
}

type MediaListener = (event: MediaQueryListEvent) => void

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<MediaListener>()
  const media = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      if (event === 'change') listeners.add(listener as MediaListener)
    }),
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      if (event === 'change') listeners.delete(listener as MediaListener)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    emit(nextMatches: boolean) {
      media.matches = nextMatches
      const event = { matches: nextMatches } as MediaQueryListEvent
      for (const listener of listeners) listener(event)
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media as unknown as MediaQueryList),
  )
  return media
}

describe('resolveTheme', () => {
  it('resolves explicit light and dark', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows system preference when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('useTheme', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    localStorage.clear()
    delete document.documentElement.dataset.theme
    useGardenStore.setState((state) => ({
      settings: { ...state.settings, colorTheme: 'system' },
      dirty: false,
    }))
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('sets data-theme to dark when colorTheme is dark', () => {
    mockMatchMedia(false)
    useGardenStore.setState((state) => ({
      settings: { ...state.settings, colorTheme: 'dark' },
    }))

    act(() => {
      root.render(<ThemeHost />)
    })

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe('dark')
  })

  it('sets data-theme to light when colorTheme is light', () => {
    mockMatchMedia(true)
    useGardenStore.setState((state) => ({
      settings: { ...state.settings, colorTheme: 'light' },
    }))

    act(() => {
      root.render(<ThemeHost />)
    })

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('uses matchMedia dark when colorTheme is system', () => {
    mockMatchMedia(true)

    act(() => {
      root.render(<ThemeHost />)
    })

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('uses matchMedia light when colorTheme is system', () => {
    mockMatchMedia(false)

    act(() => {
      root.render(<ThemeHost />)
    })

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('updates when OS preference changes under system mode', () => {
    const media = mockMatchMedia(false)

    act(() => {
      root.render(<ThemeHost />)
    })
    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => {
      media.emit(true)
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('removes matchMedia listener on unmount', () => {
    const media = mockMatchMedia(true)

    act(() => {
      root.render(<ThemeHost />)
    })
    expect(media.addEventListener).toHaveBeenCalled()

    act(() => {
      root.unmount()
    })
    expect(media.removeEventListener).toHaveBeenCalled()
  })
})
