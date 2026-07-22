import type { GalleryEntryPublic } from '@/schemas/gallery'

type Props = {
  entry: GalleryEntryPublic
  canLike: boolean
  onOpen: (shareId: string) => void
  onToggleLike: (shareId: string) => void
}

export function GalleryCard({
  entry,
  canLike,
  onOpen,
  onToggleLike,
}: Props) {
  const liked = Boolean(entry.likedByMe)

  return (
    <article className="gallery-card">
      <button
        type="button"
        className="gallery-card-media"
        onClick={() => onOpen(entry.shareId)}
        aria-label={`${entry.gardenName} 정원 보기`}
      >
        {entry.thumbnailUrl ? (
          <img
            src={entry.thumbnailUrl}
            alt={`${entry.gardenName} 썸네일`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              const fallback = event.currentTarget.nextElementSibling
              if (fallback instanceof HTMLElement) {
                fallback.hidden = false
              }
            }}
          />
        ) : null}
        <div
          className="gallery-thumb-fallback"
          hidden={Boolean(entry.thumbnailUrl)}
          aria-hidden="true"
        />
      </button>

      <div className="gallery-card-body">
        <button
          type="button"
          className="gallery-card-title"
          onClick={() => onOpen(entry.shareId)}
        >
          {entry.gardenName}
        </button>
        <p className="gallery-card-owner">by {entry.ownerUsername}</p>
        <div className="gallery-card-meta">
          <button
            type="button"
            className={`gallery-like-btn ${liked ? 'liked' : ''}`}
            aria-pressed={liked}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
            disabled={!canLike}
            title={canLike ? '좋아요' : '로그인 후 좋아요할 수 있습니다'}
            onClick={() => {
              if (!canLike) return
              onToggleLike(entry.shareId)
            }}
          >
            <span aria-hidden="true">♥</span>
            <span>{entry.likeCount}</span>
          </button>
          <span className="gallery-view-count" title="조회수">
            <span aria-hidden="true">👁</span>
            <span>{entry.viewCount}</span>
          </span>
        </div>
      </div>
    </article>
  )
}
