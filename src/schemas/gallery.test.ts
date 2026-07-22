import { describe, expect, it } from 'vitest'
import {
  GalleryEntrySchema,
  GalleryResponseSchema,
  LikeRecordSchema,
} from '@/schemas/gallery'

describe('GalleryEntrySchema', () => {
  it('accepts a valid gallery entry', () => {
    const parsed = GalleryEntrySchema.parse({
      shareId: 'abc123XYZ0',
      ownerUsername: 'gardener',
      gardenName: 'Moss Path',
      thumbnailKey: 'abc123XYZ0',
      likeCount: 3,
      viewCount: 12,
      publishedAt: '2026-07-22T00:00:00.000Z',
      isPublic: true,
    })
    expect(parsed.gardenName).toBe('Moss Path')
    expect(parsed.likeCount).toBe(3)
  })

  it('rejects negative likeCount', () => {
    const result = GalleryEntrySchema.safeParse({
      shareId: 'abc123XYZ0',
      ownerUsername: 'gardener',
      gardenName: 'Moss Path',
      thumbnailKey: 'abc123XYZ0',
      likeCount: -1,
      viewCount: 0,
      publishedAt: '2026-07-22T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = GalleryEntrySchema.safeParse({
      shareId: 'abc123XYZ0',
      likeCount: 0,
      viewCount: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('LikeRecordSchema', () => {
  it('accepts a valid ISO likedAt', () => {
    const parsed = LikeRecordSchema.parse({
      shareId: 'abc123XYZ0',
      usernameLower: 'gardener',
      likedAt: '2026-07-22T01:02:03.000Z',
    })
    expect(parsed.usernameLower).toBe('gardener')
  })

  it('rejects missing fields', () => {
    const result = LikeRecordSchema.safeParse({
      shareId: 'abc123XYZ0',
    })
    expect(result.success).toBe(false)
  })
})

describe('GalleryResponseSchema', () => {
  it('accepts responses without cursor', () => {
    const parsed = GalleryResponseSchema.parse({
      entries: [],
      totalCount: 0,
    })
    expect(parsed.cursor).toBeUndefined()
    expect(parsed.totalCount).toBe(0)
  })
})
