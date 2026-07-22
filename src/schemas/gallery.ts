import { z } from 'zod'

export const GallerySortSchema = z.enum(['likes', 'views', 'newest'])
export type GallerySort = z.infer<typeof GallerySortSchema>

export const GalleryEntrySchema = z.object({
  shareId: z.string().min(1),
  ownerUsername: z.string().min(1),
  gardenName: z.string().min(1),
  thumbnailKey: z.string().min(1),
  likeCount: z.number().int().nonnegative(),
  viewCount: z.number().int().nonnegative(),
  publishedAt: z.string().min(1),
  isPublic: z.boolean().default(true),
})
export type GalleryEntry = z.infer<typeof GalleryEntrySchema>

export const GalleryEntryPublicSchema = GalleryEntrySchema.extend({
  thumbnailUrl: z.string().nullable(),
  likedByMe: z.boolean().optional(),
})
export type GalleryEntryPublic = z.infer<typeof GalleryEntryPublicSchema>

export const GalleryResponseSchema = z.object({
  entries: z.array(GalleryEntryPublicSchema),
  totalCount: z.number().int().nonnegative(),
  cursor: z.string().optional(),
})
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>

export const LikeRecordSchema = z.object({
  shareId: z.string().min(1),
  usernameLower: z.string().min(1),
  likedAt: z.string().min(1),
})
export type LikeRecord = z.infer<typeof LikeRecordSchema>

export const GalleryCountsSchema = z.object({
  likeCount: z.number().int().nonnegative(),
  viewCount: z.number().int().nonnegative(),
})
export type GalleryCounts = z.infer<typeof GalleryCountsSchema>
