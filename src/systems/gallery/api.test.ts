import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchGallery,
  incrementGalleryView,
  toggleGalleryLike,
} from '@/systems/gallery/api'

describe('gallery api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchGallery parses a valid list response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          entries: [
            {
              shareId: 'abc123XYZ0',
              ownerUsername: 'gardener',
              gardenName: 'Moss Path',
              thumbnailKey: 'abc123XYZ0',
              thumbnailUrl: '/api/gallery-thumb?id=abc123XYZ0',
              likeCount: 1,
              viewCount: 4,
              publishedAt: '2026-07-22T00:00:00.000Z',
              isPublic: true,
            },
          ],
          totalCount: 1,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const result = await fetchGallery('likes')
    expect(result.totalCount).toBe(1)
    expect(result.entries[0]?.gardenName).toBe('Moss Path')
  })

  it('toggleGalleryLike returns liked state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ liked: true, likeCount: 8 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(toggleGalleryLike('abc123XYZ0', 'gardener')).resolves.toEqual({
      liked: true,
      likeCount: 8,
    })
  })

  it('incrementGalleryView returns viewCount', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ viewCount: 11 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(incrementGalleryView('abc123XYZ0')).resolves.toBe(11)
  })
})
