import { useEffect, useMemo, useState } from 'react'
import { CardMatch } from '@/quiz/components/CardMatch'
import { DragBins, DragOrder } from '@/quiz/components/DragPlay'
import { MultipleChoice } from '@/quiz/components/MultipleChoice'
import { parts, questionsForStage } from '@/quiz/data'
import { scoreMany, scoreQuestion } from '@/quiz/scoring'
import { useQuizStore } from '@/quiz/store'
import type { Part, Question, QuestionResponse } from '@/quiz/types'
import '@/quiz/quiz.css'

type Play = {
  partId: string
  stageIndex: number
  questionIndex: number
}

export default function QuizApp() {
  const hydrate = useQuizStore((s) => s.hydrate)
  const hydrated = useQuizStore((s) => s.hydrated)
  const responses = useQuizStore((s) => s.responses)
  const setResponse = useQuizStore((s) => s.setResponse)
  const resetAll = useQuizStore((s) => s.resetAll)
  const [play, setPlay] = useState<Play | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [draft, setDraft] = useState<QuestionResponse | undefined>(undefined)

  useEffect(() => {
    hydrate()
    document.title = 'Technical Workshop Quiz'
    document.body.classList.add('quiz-mode')
    return () => {
      document.body.classList.remove('quiz-mode')
      document.title = 'Stillgarden'
    }
  }, [hydrate])

  const part = parts.find((item) => item.id === play?.partId)
  const stageQuestions = part && play ? questionsForStage(part, play.stageIndex) : []
  const question = stageQuestions[play?.questionIndex ?? 0]
  const stage = part && play ? part.stages[play.stageIndex] : undefined

  useEffect(() => {
    setRevealed(false)
    setDraft(undefined)
  }, [play?.partId, play?.stageIndex, play?.questionIndex])

  const totals = useMemo(() => {
    const byPart = parts.map((item) => {
      const qs = item.stages.flatMap((_, index) => questionsForStage(item, index))
      return { part: item, ...scoreMany(qs, responses) }
    })
    const earned = byPart.reduce((sum, row) => sum + row.earned, 0)
    const max = byPart.reduce((sum, row) => sum + row.max, 0)
    return { byPart, earned, max }
  }, [responses])

  if (!hydrated) return <div className="quiz-shell">불러오는 중…</div>

  const goNext = () => {
    if (!part || !play) return
    if (play.questionIndex + 1 < stageQuestions.length) {
      setPlay({ ...play, questionIndex: play.questionIndex + 1 })
      return
    }
    if (play.stageIndex + 1 < part.stages.length) {
      setPlay({ partId: play.partId, stageIndex: play.stageIndex + 1, questionIndex: 0 })
      return
    }
    setPlay(null)
  }

  const submitCurrent = () => {
    if (!question || !draft) return
    setResponse(question.id, draft)
    setRevealed(true)
  }

  return (
    <div className="quiz-shell">
      <header className="quiz-top">
        <a className="quiz-brand" href="#hub" onClick={(event) => {
          event.preventDefault()
          setPlay(null)
        }}>
          August Enablement
        </a>
        <p>James Gray Technical Workshop · Day 1 복습 퀴즈</p>
        <div className="quiz-score">
          {totals.earned} / {totals.max}
        </div>
      </header>

      {!play || !part || !question || !stage ? (
        <Hub totals={totals} onStart={(partId) => setPlay({ partId, stageIndex: 0, questionIndex: 0 })} onReset={resetAll} />
      ) : (
        <main className="quiz-main">
          <div className="stage-bar">
            <span>
              파트 {part.number} · {part.title}
            </span>
            <strong>{stage.title}</strong>
            <span>
              스테이지 {play.stageIndex + 1}/{part.stages.length}
            </span>
          </div>
          <p className="stage-blurb">{stage.blurb}</p>
          {question.type === 'mcq' ? (
            <MultipleChoice
              question={question}
              index={play.questionIndex}
              total={stageQuestions.length}
              selectedId={asType('mcq', draft, responses[question.id])?.choiceId}
              revealed={revealed}
              onSelect={(choiceId) => setDraft({ type: 'mcq', choiceId })}
            />
          ) : null}
          {question.type === 'match' ? (
            <CardMatch
              question={question}
              mapping={asType('match', draft, responses[question.id])?.mapping ?? {}}
              revealed={revealed}
              onChange={(mapping) => setDraft({ type: 'match', mapping })}
            />
          ) : null}
          {question.type === 'drag-order' ? (
            <DragOrder
              question={question}
              order={asType('drag-order', draft, responses[question.id])?.order ?? []}
              revealed={revealed}
              onChange={(order) => setDraft({ type: 'drag-order', order })}
            />
          ) : null}
          {question.type === 'drag-bins' ? (
            <DragBins
              question={question}
              placement={asType('drag-bins', draft, responses[question.id])?.placement ?? {}}
              revealed={revealed}
              onChange={(placement) => setDraft({ type: 'drag-bins', placement })}
            />
          ) : null}
          {revealed && question ? (
            <p className="score-banner" role="status">
              이번 문항 점수{' '}
              {scoreQuestion(question, draft ?? responses[question.id]).earned} /{' '}
              {scoreQuestion(question, draft ?? responses[question.id]).max}
            </p>
          ) : null}
          <div className="quiz-actions">
            <button type="button" className="ghost" onClick={() => setPlay(null)}>
              파트 목록
            </button>
            {!revealed ? (
              <button type="button" className="primary" disabled={!canSubmit(question, draft)} onClick={submitCurrent}>
                채점하기
              </button>
            ) : (
              <button type="button" className="primary" onClick={goNext}>
                {play.questionIndex + 1 < stageQuestions.length
                  ? '다음 문항'
                  : play.stageIndex + 1 < part.stages.length
                    ? `다음: ${part.stages[play.stageIndex + 1]?.title}`
                    : '파트 완료'}
              </button>
            )}
          </div>
        </main>
      )}
    </div>
  )
}

function asType<T extends QuestionResponse['type']>(
  type: T,
  draft: QuestionResponse | undefined,
  saved: QuestionResponse | undefined,
): Extract<QuestionResponse, { type: T }> | undefined {
  if (draft?.type === type) return draft as Extract<QuestionResponse, { type: T }>
  if (saved?.type === type) return saved as Extract<QuestionResponse, { type: T }>
  return undefined
}

function canSubmit(question: Question, draft: QuestionResponse | undefined): boolean {
  if (!draft || draft.type !== question.type) return false
  if (question.type === 'mcq' && draft.type === 'mcq') return Boolean(draft.choiceId)
  if (question.type === 'match' && draft.type === 'match') {
    return question.left.every((item) => Boolean(draft.mapping[item.id]))
  }
  if (question.type === 'drag-order' && draft.type === 'drag-order') {
    return draft.order.filter(Boolean).length === question.answer.length
  }
  if (question.type === 'drag-bins' && draft.type === 'drag-bins') {
    return question.items.every((item) => Boolean(draft.placement[item.id]))
  }
  return false
}

function Hub({
  totals,
  onStart,
  onReset,
}: {
  totals: { byPart: { part: Part; earned: number; max: number }[]; earned: number; max: number }
  onStart: (partId: string) => void
  onReset: () => void
}) {
  return (
    <main className="quiz-hub">
      <div className="hero">
        <p className="eyebrow">Maven · Technical Workshop</p>
        <h1>세션을 실제로 이해했는지 확인합니다</h1>
        <p>
          유형이 섞이지 않습니다. 각 파트는 객관식 → 카드 매칭 → 드래그(또는 그 역순)처럼 한 스테이지에 한
          상호작용만 있습니다. 슬라이드는 문항 안의 “워크숍 슬라이드 보기”로 다시 펼 수 있습니다.
        </p>
      </div>
      <ul className="part-grid">
        {totals.byPart.map(({ part, earned, max }) => (
          <li key={part.id}>
            <button type="button" className="part-card" onClick={() => onStart(part.id)}>
              <span className="part-num">0{part.number}</span>
              <h2>{part.title}</h2>
              <p>{part.summary}</p>
              <ol>
                {part.stages.map((stage) => (
                  <li key={stage.id}>{stage.title}</li>
                ))}
              </ol>
              <div className="part-score">
                {earned} / {max}
                {max > 0 && earned === max ? ' · 완료' : ''}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <footer className="hub-foot">
        <span>
          전체 {totals.earned} / {totals.max}
        </span>
        <button type="button" className="ghost" onClick={onReset}>
          모든 답 지우기
        </button>
        <a className="ghost-link" href={import.meta.env.BASE_URL}>
          Stillgarden으로
        </a>
      </footer>
    </main>
  )
}
