import {
  GalleryResponseSchema,
  type GalleryEntryPublic,
  type GallerySort,
} from '@/schemas/gallery'

export async function fetchGallery(
  sort: GallerySort,
  options?: { limit?: number; cursor?: string },
): Promise<{
  entries: GalleryEntryPublic[]
  totalCount: number
  cursor?: string
}> {
  const params = new URLSearchParams({ sort })
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.cursor) params.set('cursor', options.cursor)

  const res = await fetch(`/api/gallery?${params.toString()}`)
  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '갤러리를 불러오지 못했습니다.')
  }
  return GalleryResponseSchema.parse(data)
}

export async function publishToGallery(input: {
  shareId: string
  username: string
  gardenName: string
  thumbnailDataUrl?: string
  isPublic: boolean
}): Promise<GalleryEntryPublic | null> {
  const res = await fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'publish', ...input }),
  })
  const data = (await res.json()) as {
    ok?: boolean
    entry?: GalleryEntryPublic | null
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error ?? '갤러리 공개에 실패했습니다.')
  }
  return data.entry ?? null
}

export async function unpublishFromGallery(
  shareId: string,
  username: string,
): Promise<void> {
  const res = await fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unpublish', shareId, username }),
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '갤러리 비공개 전환에 실패했습니다.')
  }
}

export async function toggleGalleryLike(
  shareId: string,
  username: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch('/api/gallery-like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like', shareId, username }),
  })
  const data = (await res.json()) as {
    liked?: boolean
    likeCount?: number
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error ?? '좋아요를 처리하지 못했습니다.')
  }
  if (typeof data.liked !== 'boolean' || typeof data.likeCount !== 'number') {
    throw new Error('좋아요 응답이 올바르지 않습니다.')
  }
  return { liked: data.liked, likeCount: data.likeCount }
}

export async function incrementGalleryView(
  shareId: string,
): Promise<number> {
  const res = await fetch('/api/gallery-like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'view', shareId }),
  })
  const data = (await res.json()) as { viewCount?: number; error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '조회수를 갱신하지 못했습니다.')
  }
  return data.viewCount ?? 0
}

export async function fetchMyGalleryLikes(
  username: string,
): Promise<string[]> {
  const res = await fetch(
    `/api/gallery-like?username=${encodeURIComponent(username)}`,
  )
  const data = (await res.json()) as { likedIds?: string[]; error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '좋아요 목록을 불러오지 못했습니다.')
  }
  return Array.isArray(data.likedIds) ? data.likedIds : []
}
