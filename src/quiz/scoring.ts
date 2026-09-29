import type { Question, QuestionResponse, ScoreResult } from '@/quiz/types'

export function maxScore(question: Question): number {
  switch (question.type) {
    case 'mcq':
      return 1
    case 'match':
      return Object.keys(question.pairs).length
    case 'drag-order':
      return question.answer.length
    case 'drag-bins':
      return Object.keys(question.answer).length
  }
}

function sameMapping(expected: Record<string, string>, actual: Record<string, string>): ScoreResult {
  const keys = Object.keys(expected)
  let earned = 0
  for (const key of keys) {
    if (actual[key] === expected[key]) earned += 1
  }
  return { earned, max: keys.length, correct: earned === keys.length }
}

export function scoreQuestion(question: Question, response: QuestionResponse | undefined): ScoreResult {
  const max = maxScore(question)
  if (!response || response.type !== question.type) {
    return { earned: 0, max, correct: false }
  }

  switch (question.type) {
    case 'mcq': {
      if (response.type !== 'mcq') return { earned: 0, max, correct: false }
      const correct = response.choiceId === question.answerId
      return { earned: correct ? 1 : 0, max, correct }
    }
    case 'match': {
      if (response.type !== 'match') return { earned: 0, max, correct: false }
      return sameMapping(question.pairs, response.mapping)
    }
    case 'drag-order': {
      if (response.type !== 'drag-order') return { earned: 0, max, correct: false }
      let earned = 0
      question.answer.forEach((id, index) => {
        if (response.order[index] === id) earned += 1
      })
      return { earned, max, correct: earned === max }
    }
    case 'drag-bins': {
      if (response.type !== 'drag-bins') return { earned: 0, max, correct: false }
      return sameMapping(question.answer, response.placement)
    }
  }
}

export function scoreMany(
  questions: Question[],
  responses: Record<string, QuestionResponse | undefined>,
): ScoreResult {
  const initial: ScoreResult = { earned: 0, max: 0, correct: true }
  return questions.reduce((acc, question) => {
    const result = scoreQuestion(question, responses[question.id])
    return {
      earned: acc.earned + result.earned,
      max: acc.max + result.max,
      correct: acc.correct && result.correct,
    }
  }, initial)
}

export function difficultyLabel(level: Question['difficulty']): string {
  if (level === 'easy') return '하'
  if (level === 'medium') return '중'
  return '상'
}
