import { useCallback, useState } from 'react'
import type { GardenSaveData } from '@/schemas/garden'
import { createShareLink } from '@/systems/share/api'
import { useAuthStore } from '@/stores/authStore'

export type UseShareGardenResult = {
  isSharing: boolean
  shareUrl: string | null
  error: string | null
  createShare: (
    garden: GardenSaveData,
    thumbnailDataUrl?: string,
  ) => Promise<string | null>
  copyToClipboard: (url?: string | null) => Promise<boolean>
}

export function useShareGarden(): UseShareGardenResult {
  const user = useAuthStore((s) => s.user)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createShare = useCallback(
    async (garden: GardenSaveData, thumbnailDataUrl?: string) => {
      if (!user) {
        setError('로그인이 필요합니다.')
        return null
      }

      setIsSharing(true)
      setError(null)
      try {
        const result = await createShareLink(
          user.username,
          garden,
          thumbnailDataUrl,
        )
        setShareUrl(result.shareUrl)
        return result.shareUrl
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '공유 링크를 만들지 못했습니다.'
        setError(message)
        return null
      } finally {
        setIsSharing(false)
      }
    },
    [user],
  )

  const copyToClipboard = useCallback(async (url?: string | null) => {
    const target = url ?? shareUrl
    if (!target) return false
    try {
      await navigator.clipboard.writeText(target)
      return true
    } catch {
      setError('클립보드에 복사하지 못했습니다.')
      return false
    }
  }, [shareUrl])

  return {
    isSharing,
    shareUrl,
    error,
    createShare,
    copyToClipboard,
  }
}
