import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import { useShareGarden } from '@/hooks/useShareGarden'
import { useAuthStore } from '@/stores/authStore'
import * as shareApi from '@/systems/share/api'

vi.mock('@/systems/share/api', () => ({
  createShareLink: vi.fn(async () => ({
    shareId: 'shareTest01',
    shareUrl: 'https://example.com/garden/shareTest01',
  })),
}))

describe('useShareGarden', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { username: 'gardener', createdAt: '2026-07-17T00:00:00.000Z' },
      hydrated: true,
    })
    vi.mocked(shareApi.createShareLink).mockReset()
    vi.mocked(shareApi.createShareLink).mockResolvedValue({
      shareId: 'shareTest01',
      shareUrl: 'https://example.com/garden/shareTest01',
    })
  })

  it('starts idle with no share URL', () => {
    const { result } = renderHook(() => useShareGarden())
    expect(result.current.isSharing).toBe(false)
    expect(result.current.shareUrl).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets isSharing while createShare runs, then stores shareUrl', async () => {
    let resolveShare!: (value: {
      shareId: string
      shareUrl: string
    }) => void
    vi.mocked(shareApi.createShareLink).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveShare = resolve
        }),
    )

    const garden = createNewGardenSave('Hook Garden', 'empty')
    const { result } = renderHook(() => useShareGarden())

    let createPromise: Promise<{ shareId: string; shareUrl: string } | null>
    act(() => {
      createPromise = result.current.createShare(garden)
    })

    await waitFor(() => {
      expect(result.current.isSharing).toBe(true)
    })

    await act(async () => {
      resolveShare({
        shareId: 'shareTest01',
        shareUrl: 'https://example.com/garden/shareTest01',
      })
      await createPromise!
    })

    expect(result.current.isSharing).toBe(false)
    expect(result.current.shareUrl).toBe(
      'https://example.com/garden/shareTest01',
    )
    expect(result.current.shareId).toBe('shareTest01')
  })

  it('copyToClipboard writes the share URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const garden = createNewGardenSave('Hook Garden', 'empty')
    const { result } = renderHook(() => useShareGarden())

    await act(async () => {
      await result.current.createShare(garden)
    })

    let copied = false
    await act(async () => {
      copied = await result.current.copyToClipboard()
    })

    expect(copied).toBe(true)
    expect(writeText).toHaveBeenCalledWith(
      'https://example.com/garden/shareTest01',
    )
  })
})
