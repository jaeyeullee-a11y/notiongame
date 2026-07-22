import { useEffect } from 'react'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import { SortSelector } from '@/components/gallery/SortSelector'
import type { GallerySort } from '@/schemas/gallery'
import { useAuthStore } from '@/stores/authStore'
import { useGalleryStore } from '@/stores/galleryStore'

function goHome(): void {
  window.location.assign(`${import.meta.env.BASE_URL}`)
}

function openSharedGarden(shareId: string): void {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  window.location.assign(`${base}garden/${shareId}`)
}

export default function GalleryPage() {
  const user = useAuthStore((s) => s.user)
  const hydrateSession = useAuthStore((s) => s.hydrateSession)
  const hydrated = useAuthStore((s) => s.hydrated)
  const entries = useGalleryStore((s) => s.entries)
  const sort = useGalleryStore((s) => s.sort)
  const loading = useGalleryStore((s) => s.loading)
  const error = useGalleryStore((s) => s.error)
  const cursor = useGalleryStore((s) => s.cursor)
  const setSort = useGalleryStore((s) => s.setSort)
  const fetchGallery = useGalleryStore((s) => s.fetchGallery)
  const fetchMyLikes = useGalleryStore((s) => s.fetchMyLikes)
  const toggleLike = useGalleryStore((s) => s.toggleLike)

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    void fetchGallery(sort)
  }, [fetchGallery, sort])

  useEffect(() => {
    if (!hydrated || !user) return
    void fetchMyLikes(user.username)
  }, [hydrated, user, fetchMyLikes])

  const onSortChange = (next: GallerySort) => {
    setSort(next)
  }

  const onToggleLike = (shareId: string) => {
    if (!user) return
    void toggleLike(shareId, user.username)
  }

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div className="gallery-header-copy">
          <h1>Stillgarden Gallery</h1>
          <p>공유된 정원을 둘러보고 영감을 얻어 보세요.</p>
        </div>
        <div className="gallery-header-actions">
          <SortSelector value={sort} onChange={onSortChange} disabled={loading} />
          <a className="btn" href={`${import.meta.env.BASE_URL}`}>
            {user ? '편집기로 돌아가기' : '나만의 정원 만들기'}
          </a>
        </div>
      </header>

      {error && (
        <div className="gallery-banner gallery-banner-error" role="alert">
          {error}
          {!navigator.onLine && ' (오프라인 상태입니다. 네트워크 연결을 확인해 주세요.)'}
        </div>
      )}

      {loading && entries.length === 0 && (
        <div className="gallery-empty">
          <p>갤러리를 불러오는 중…</p>
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="gallery-empty">
          <h2>아직 공개된 정원이 없습니다</h2>
          <p>클라우드에서 정원을 공유하고 갤러리에 공개해 보세요.</p>
          <button type="button" className="btn btn-primary" onClick={goHome}>
            정원 꾸미러 가기
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="gallery-grid">
            {entries.map((entry) => (
              <GalleryCard
                key={entry.shareId}
                entry={entry}
                canLike={Boolean(user)}
                onOpen={openSharedGarden}
                onToggleLike={onToggleLike}
              />
            ))}
          </div>
          {cursor && (
            <div className="gallery-more">
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={() => void fetchGallery(sort, true)}
              >
                {loading ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
