import { useMemo } from 'react'
import { SlidePeek } from '@/quiz/components/SlidePeek'
import { shuffle } from '@/quiz/shuffle'
import type { McqQuestion } from '@/quiz/types'

type Props = {
  question: McqQuestion
  index: number
  total: number
  selectedId?: string
  revealed: boolean
  onSelect: (choiceId: string) => void
}

export function MultipleChoice({ question, index, total, selectedId, revealed, onSelect }: Props) {
  const choices = useMemo(
    () => shuffle(question.choices, `${question.id}:choices`),
    [question],
  )

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span>
          {index + 1} / {total}
        </span>
        <span className={`diff diff-${question.difficulty}`}>
          {question.difficulty === 'easy' ? '하' : question.difficulty === 'medium' ? '중' : '상'}
        </span>
      </div>
      <h2>{question.prompt}</h2>
      <SlidePeek src={question.image} alt="관련 워크숍 슬라이드" />
      <div className="choice-grid" role="listbox" aria-label="보기">
        {choices.map((choice) => {
          const selected = selectedId === choice.id
          const isAnswer = choice.id === question.answerId
          let state = ''
          if (revealed && isAnswer) state = 'is-correct'
          else if (revealed && selected && !isAnswer) state = 'is-wrong'
          else if (selected) state = 'is-selected'
          return (
            <button
              key={choice.id}
              type="button"
              className={`choice ${state}`}
              disabled={revealed}
              onClick={() => onSelect(choice.id)}
            >
              {choice.text}
            </button>
          )
        })}
      </div>
      {revealed ? <p className="explain">{question.explain}</p> : null}
    </div>
  )
}
