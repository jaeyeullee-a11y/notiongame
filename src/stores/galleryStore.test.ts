import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGalleryStore } from '@/stores/galleryStore'
import * as galleryApi from '@/systems/gallery/api'

vi.mock('@/systems/gallery/api', () => ({
  fetchGallery: vi.fn(),
  fetchMyGalleryLikes: vi.fn(),
  toggleGalleryLike: vi.fn(),
}))

const sampleEntry = {
  shareId: 'shareTest01',
  ownerUsername: 'gardener',
  gardenName: 'Quiet Pond',
  thumbnailKey: 'shareTest01',
  thumbnailUrl: '/api/gallery-thumb?id=shareTest01',
  likeCount: 2,
  viewCount: 5,
  publishedAt: '2026-07-22T00:00:00.000Z',
  isPublic: true,
}

describe('galleryStore', () => {
  beforeEach(() => {
    useGalleryStore.getState().reset()
    useGalleryStore.setState({ sort: 'likes' })
    vi.mocked(galleryApi.fetchGallery).mockReset()
    vi.mocked(galleryApi.toggleGalleryLike).mockReset()
    vi.mocked(galleryApi.fetchMyGalleryLikes).mockReset()
  })

  it('setSort updates sort state', () => {
    useGalleryStore.getState().setSort('newest')
    expect(useGalleryStore.getState().sort).toBe('newest')
  })

  it('fetchGallery stores entries from the API', async () => {
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue({
      entries: [sampleEntry],
      totalCount: 1,
    })

    await useGalleryStore.getState().fetchGallery('views')

    const state = useGalleryStore.getState()
    expect(state.sort).toBe('views')
    expect(state.entries).toHaveLength(1)
    expect(state.entries[0]?.gardenName).toBe('Quiet Pond')
    expect(state.totalCount).toBe(1)
    expect(state.loading).toBe(false)
  })

  it('toggleLike inserts and removes likedIds', async () => {
    useGalleryStore.setState({
      entries: [sampleEntry],
      likedIds: new Set(),
    })

    vi.mocked(galleryApi.toggleGalleryLike).mockResolvedValueOnce({
      liked: true,
      likeCount: 3,
    })
    await useGalleryStore.getState().toggleLike('shareTest01', 'gardener')
    expect(useGalleryStore.getState().likedIds.has('shareTest01')).toBe(true)
    expect(useGalleryStore.getState().entries[0]?.likeCount).toBe(3)

    vi.mocked(galleryApi.toggleGalleryLike).mockResolvedValueOnce({
      liked: false,
      likeCount: 2,
    })
    await useGalleryStore.getState().toggleLike('shareTest01', 'gardener')
    expect(useGalleryStore.getState().likedIds.has('shareTest01')).toBe(false)
    expect(useGalleryStore.getState().entries[0]?.likeCount).toBe(2)
  })
})
