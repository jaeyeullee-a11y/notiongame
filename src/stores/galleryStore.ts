import { create } from 'zustand'
import type { GalleryEntryPublic, GallerySort } from '@/schemas/gallery'
import {
  fetchGallery,
  fetchMyGalleryLikes,
  toggleGalleryLike,
} from '@/systems/gallery/api'

type GalleryState = {
  entries: GalleryEntryPublic[]
  totalCount: number
  cursor?: string
  sort: GallerySort
  loading: boolean
  error: string | null
  likedIds: Set<string>
  setSort: (sort: GallerySort) => void
  fetchGallery: (sort?: GallerySort, append?: boolean) => Promise<void>
  toggleLike: (shareId: string, username: string) => Promise<void>
  fetchMyLikes: (username: string) => Promise<void>
  reset: () => void
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  entries: [],
  totalCount: 0,
  cursor: undefined,
  sort: 'likes',
  loading: false,
  error: null,
  likedIds: new Set(),

  setSort: (sort) => {
    set({ sort })
  },

  fetchGallery: async (sort, append = false) => {
    const nextSort = sort ?? get().sort
    const cursor = append ? get().cursor : undefined
    if (append && !cursor) return

    set({ loading: true, error: null, sort: nextSort })
    try {
      const result = await fetchGallery(nextSort, {
        limit: 20,
        cursor,
      })
      const likedIds = get().likedIds
      const mapped = result.entries.map((entry) => ({
        ...entry,
        likedByMe: likedIds.has(entry.shareId),
      }))
      set((state) => ({
        entries: append ? [...state.entries, ...mapped] : mapped,
        totalCount: result.totalCount,
        cursor: result.cursor,
        loading: false,
      }))
    } catch (err) {
      set({
        loading: false,
        error:
          err instanceof Error ? err.message : '갤러리를 불러오지 못했습니다.',
      })
    }
  },

  toggleLike: async (shareId, username) => {
    try {
      const result = await toggleGalleryLike(shareId, username)
      set((state) => {
        const likedIds = new Set(state.likedIds)
        if (result.liked) likedIds.add(shareId)
        else likedIds.delete(shareId)
        return {
          likedIds,
          entries: state.entries.map((entry) =>
            entry.shareId === shareId
              ? {
                  ...entry,
                  likeCount: result.likeCount,
                  likedByMe: result.liked,
                }
              : entry,
          ),
        }
      })
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : '좋아요를 처리하지 못했습니다.',
      })
      throw err
    }
  },

  fetchMyLikes: async (username) => {
    try {
      const likedIds = await fetchMyGalleryLikes(username)
      const likedSet = new Set(likedIds)
      set((state) => ({
        likedIds: likedSet,
        entries: state.entries.map((entry) => ({
          ...entry,
          likedByMe: likedSet.has(entry.shareId),
        })),
      }))
    } catch {
      // Non-fatal for anonymous browsing; ignore.
    }
  },

  reset: () => {
    set({
      entries: [],
      totalCount: 0,
      cursor: undefined,
      loading: false,
      error: null,
      likedIds: new Set(),
    })
  },
}))
