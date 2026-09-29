import { useMemo, useState } from 'react'
import { SlidePeek } from '@/quiz/components/SlidePeek'
import { shuffle } from '@/quiz/shuffle'
import type { MatchQuestion } from '@/quiz/types'

type Props = {
  question: MatchQuestion
  mapping: Record<string, string>
  revealed: boolean
  onChange: (mapping: Record<string, string>) => void
}

export function CardMatch({ question, mapping, revealed, onChange }: Props) {
  const [pickedLeft, setPickedLeft] = useState<string | null>(null)
  const right = useMemo(() => shuffle(question.right, `${question.id}:right`), [question])

  const assign = (leftId: string, rightId: string) => {
    if (revealed) return
    onChange({ ...mapping, [leftId]: rightId })
    setPickedLeft(null)
  }

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span>한 화면 매칭</span>
        <span className={`diff diff-${question.difficulty}`}>
          {question.difficulty === 'easy' ? '하' : question.difficulty === 'medium' ? '중' : '상'}
        </span>
      </div>
      <h2>{question.prompt}</h2>
      <p className="hint">왼쪽 카드를 고른 뒤 오른쪽 카드에 연결하세요. 같은 오른쪽을 여러 왼쪽에 쓸 수 있습니다.</p>
      <SlidePeek src={question.image} alt="관련 워크숍 슬라이드" />
      <div className="match-board">
        <ul className="match-col">
          {question.left.map((item) => {
            const bound = mapping[item.id]
            const boundLabel = question.right.find((r) => r.id === bound)?.text
            const ok = revealed && bound === question.pairs[item.id]
            const bad = revealed && bound !== question.pairs[item.id]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`match-card ${pickedLeft === item.id ? 'is-selected' : ''} ${ok ? 'is-correct' : ''} ${bad ? 'is-wrong' : ''}`}
                  disabled={revealed}
                  onClick={() => setPickedLeft(item.id)}
                >
                  <strong>{item.text}</strong>
                  <span className="match-bound">{boundLabel ?? '아직 연결 안 함'}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <ul className="match-col match-col-right">
          {right.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="match-card match-target"
                disabled={revealed || !pickedLeft}
                onClick={() => {
                  if (pickedLeft) assign(pickedLeft, item.id)
                }}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {revealed ? <p className="explain">{question.explain}</p> : null}
    </div>
  )
}
