import { useMemo, useState } from 'react'
import { SlidePeek } from '@/quiz/components/SlidePeek'
import { shuffle } from '@/quiz/shuffle'
import type { DragBinsQuestion, DragOrderQuestion } from '@/quiz/types'

type OrderProps = {
  question: DragOrderQuestion
  order: string[]
  revealed: boolean
  onChange: (order: string[]) => void
}

export function DragOrder({ question, order, revealed, onChange }: OrderProps) {
  const [held, setHeld] = useState<string | null>(null)
  const pool = useMemo(() => {
    const used = new Set(order.filter(Boolean))
    return shuffle(
      question.items.filter((item) => !used.has(item.id)),
      `${question.id}:pool`,
    )
  }, [question, order])

  const label = (id: string | undefined) => question.items.find((item) => item.id === id)?.text

  const place = (index: number, id: string) => {
    if (revealed) return
    const next = [...order]
    while (next.length < question.answer.length) next.push('')
    const existing = next[index]
    const fromIndex = next.indexOf(id)
    if (fromIndex >= 0) next[fromIndex] = existing ?? ''
    next[index] = id
    onChange(next.map((value) => value || ''))
    setHeld(null)
  }

  const pickFromPool = (id: string) => {
    if (revealed) return
    const empty = order.findIndex((value) => !value)
    if (empty >= 0 && !held) {
      place(empty, id)
      return
    }
    setHeld(id)
  }

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span>드래그 · 순서</span>
        <span className={`diff diff-${question.difficulty}`}>
          {question.difficulty === 'easy' ? '하' : question.difficulty === 'medium' ? '중' : '상'}
        </span>
      </div>
      <h2>{question.prompt}</h2>
      <p className="hint">카드를 고른 뒤 칸을 누르거나, 빈 칸에 순서대로 올려 놓으세요.</p>
      <SlidePeek src={question.image} alt="관련 워크숍 슬라이드" />
      <ol className="order-slots">
        {question.answer.map((_, index) => {
          const id = order[index]
          const ok = revealed && id === question.answer[index]
          const bad = revealed && id !== question.answer[index]
          return (
            <li key={index}>
              <button
                type="button"
                className={`drop-slot ${ok ? 'is-correct' : ''} ${bad ? 'is-wrong' : ''}`}
                disabled={revealed}
                onClick={() => {
                  if (held) place(index, held)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const id = event.dataTransfer.getData('text/plain')
                  if (id) place(index, id)
                }}
              >
                <span className="slot-index">{index + 1}</span>
                {label(id) ?? '여기로'}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="pool">
        {pool.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable={!revealed}
            className={`chip ${held === item.id ? 'is-selected' : ''}`}
            disabled={revealed}
            onClick={() => pickFromPool(item.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', item.id)
              setHeld(item.id)
            }}
          >
            {item.text}
          </button>
        ))}
      </div>
      {revealed ? <p className="explain">{question.explain}</p> : null}
    </div>
  )
}

type BinProps = {
  question: DragBinsQuestion
  placement: Record<string, string>
  revealed: boolean
  onChange: (placement: Record<string, string>) => void
}

export function DragBins({ question, placement, revealed, onChange }: BinProps) {
  const [held, setHeld] = useState<string | null>(null)
  const pool = useMemo(() => {
    const used = new Set(Object.keys(placement))
    return shuffle(
      question.items.filter((item) => !used.has(item.id)),
      `${question.id}:bins`,
    )
  }, [question, placement])

  const put = (itemId: string, slotId: string) => {
    if (revealed) return
    onChange({ ...placement, [itemId]: slotId })
    setHeld(null)
  }

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span>드래그 · 분류</span>
        <span className={`diff diff-${question.difficulty}`}>
          {question.difficulty === 'easy' ? '하' : question.difficulty === 'medium' ? '중' : '상'}
        </span>
      </div>
      <h2>{question.prompt}</h2>
      <p className="hint">카드를 고른 뒤 오른쪽 칸을 누르세요. 드래그도 됩니다.</p>
      <SlidePeek src={question.image} alt="관련 워크숍 슬라이드" />
      <div className="pool">
        {pool.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable={!revealed}
            className={`chip ${held === item.id ? 'is-selected' : ''}`}
            disabled={revealed}
            onClick={() => setHeld(item.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', item.id)
              setHeld(item.id)
            }}
          >
            {item.text}
          </button>
        ))}
      </div>
      <div className={`bin-grid bin-count-${question.slots.length}`}>
        {question.slots.map((slot) => {
          const occupants = question.items.filter((item) => placement[item.id] === slot.id)
          return (
            <section
              key={slot.id}
              className="bin"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const id = event.dataTransfer.getData('text/plain')
                if (id) put(id, slot.id)
              }}
            >
              <header>
                <strong>{slot.label}</strong>
                {slot.hint ? <span>{slot.hint}</span> : null}
              </header>
              <button
                type="button"
                className="bin-drop"
                disabled={revealed || !held}
                onClick={() => {
                  if (held) put(held, slot.id)
                }}
              >
                {occupants.length === 0 ? '여기로 놓기' : null}
                {occupants.map((item) => {
                  const ok = revealed && question.answer[item.id] === slot.id
                  const bad = revealed && question.answer[item.id] !== slot.id
                  return (
                    <span key={item.id} className={`chip in-bin ${ok ? 'is-correct' : ''} ${bad ? 'is-wrong' : ''}`}>
                      {item.text}
                    </span>
                  )
                })}
              </button>
            </section>
          )
        })}
      </div>
      {revealed ? <p className="explain">{question.explain}</p> : null}
    </div>
  )
}
