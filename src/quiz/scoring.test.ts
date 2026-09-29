import { describe, expect, it } from 'vitest'
import { maxScore, scoreMany, scoreQuestion } from '@/quiz/scoring'
import type { DragBinsQuestion, DragOrderQuestion, MatchQuestion, McqQuestion } from '@/quiz/types'

const mcq: McqQuestion = {
  id: 'q1',
  type: 'mcq',
  difficulty: 'easy',
  prompt: 'p',
  choices: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  answerId: 'b',
  explain: 'e',
}

const match: MatchQuestion = {
  id: 'q2',
  type: 'match',
  difficulty: 'medium',
  prompt: 'p',
  left: [
    { id: 'l1', text: 'L1' },
    { id: 'l2', text: 'L2' },
  ],
  right: [
    { id: 'r1', text: 'R1' },
    { id: 'r2', text: 'R2' },
  ],
  pairs: { l1: 'r2', l2: 'r1' },
  explain: 'e',
}

const order: DragOrderQuestion = {
  id: 'q3',
  type: 'drag-order',
  difficulty: 'easy',
  prompt: 'p',
  items: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
  ],
  answer: ['a', 'b', 'c'],
  explain: 'e',
}

const bins: DragBinsQuestion = {
  id: 'q4',
  type: 'drag-bins',
  difficulty: 'hard',
  prompt: 'p',
  items: [
    { id: 'zendesk', text: 'Zendesk' },
    { id: 'okta', text: 'Okta' },
  ],
  slots: [
    { id: '01', label: '01' },
    { id: '07', label: '07' },
  ],
  answer: { zendesk: '01', okta: '07' },
  explain: 'e',
}

describe('scoreQuestion', () => {
  it('scores multiple choice', () => {
    expect(scoreQuestion(mcq, { type: 'mcq', choiceId: 'b' })).toEqual({
      earned: 1,
      max: 1,
      correct: true,
    })
    expect(scoreQuestion(mcq, { type: 'mcq', choiceId: 'a' }).correct).toBe(false)
    expect(scoreQuestion(mcq, undefined).earned).toBe(0)
  })

  it('gives partial credit on match and bins', () => {
    expect(
      scoreQuestion(match, { type: 'match', mapping: { l1: 'r2', l2: 'r2' } }),
    ).toEqual({ earned: 1, max: 2, correct: false })
    expect(
      scoreQuestion(bins, { type: 'drag-bins', placement: { zendesk: '01', okta: '07' } }).correct,
    ).toBe(true)
  })

  it('scores ordered drag per position', () => {
    expect(scoreQuestion(order, { type: 'drag-order', order: ['a', 'c', 'b'] })).toEqual({
      earned: 1,
      max: 3,
      correct: false,
    })
    expect(maxScore(order)).toBe(3)
  })

  it('rejects mismatched response types', () => {
    expect(scoreQuestion(mcq, { type: 'match', mapping: {} }).earned).toBe(0)
  })
})

describe('scoreMany', () => {
  it('sums earned and max', () => {
    const result = scoreMany([mcq, order], {
      q1: { type: 'mcq', choiceId: 'b' },
      q3: { type: 'drag-order', order: ['a', 'b', 'c'] },
    })
    expect(result).toEqual({ earned: 4, max: 4, correct: true })
  })
})
