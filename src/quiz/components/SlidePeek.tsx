import { quizAsset } from '@/quiz/data'

export function SlidePeek({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null
  return (
    <details className="slide-peek">
      <summary>워크숍 슬라이드 보기</summary>
      <img src={quizAsset(src)} alt={alt} />
    </details>
  )
}
