import type { GallerySort } from '@/schemas/gallery'

const OPTIONS: Array<{ id: GallerySort; label: string }> = [
  { id: 'likes', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'views', label: '조회수순' },
]

type Props = {
  value: GallerySort
  onChange: (sort: GallerySort) => void
  disabled?: boolean
}

export function SortSelector({ value, onChange, disabled }: Props) {
  return (
    <label className="gallery-sort">
      <span className="sr-only">정렬</span>
      <select
        className="gallery-sort-select"
        value={value}
        disabled={disabled}
        aria-label="갤러리 정렬"
        onChange={(event) => onChange(event.target.value as GallerySort)}
      >
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
