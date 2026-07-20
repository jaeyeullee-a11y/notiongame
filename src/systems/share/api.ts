import { GardenSaveDataSchema, type GardenSaveData } from '@/schemas/garden'

export type ShareCreateResult = {
  shareId: string
  shareUrl: string
}

export type ShareLoadResult = {
  garden: GardenSaveData
  thumbnailDataUrl?: string
  createdAt: string
}

export async function createShareLink(
  username: string,
  garden: GardenSaveData,
  thumbnailDataUrl?: string,
): Promise<ShareCreateResult> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, garden, thumbnailDataUrl }),
  })

  const data = (await res.json()) as ShareCreateResult & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '공유 링크를 만들지 못했습니다.')
  }
  if (!data.shareId || !data.shareUrl) {
    throw new Error('공유 응답이 올바르지 않습니다.')
  }
  return { shareId: data.shareId, shareUrl: data.shareUrl }
}

export async function loadSharedGarden(
  shareId: string,
): Promise<ShareLoadResult | null> {
  const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
  if (res.status === 404) return null

  const data = (await res.json()) as {
    garden?: unknown
    thumbnailDataUrl?: string
    createdAt?: string
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error ?? '공유 정원을 불러오지 못했습니다.')
  }

  const garden = GardenSaveDataSchema.parse(data.garden)
  if (typeof data.createdAt !== 'string') {
    throw new Error('공유 정원 응답이 올바르지 않습니다.')
  }

  return {
    garden,
    thumbnailDataUrl: data.thumbnailDataUrl,
    createdAt: data.createdAt,
  }
}
