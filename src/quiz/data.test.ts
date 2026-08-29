import { describe, expect, it } from 'vitest'
import { parts, questionById, questions } from '@/quiz/data'

describe('workshop quiz data', () => {
  it('references only existing questions and uses each once', () => {
    const used: string[] = []
    for (const part of parts) {
      for (const stage of part.stages) {
        for (const id of stage.questionIds) {
          expect(questionById.has(id), id).toBe(true)
          const question = questionById.get(id)!
          expect(question.type).toBe(stage.type)
          used.push(id)
        }
      }
    }
    expect(new Set(used).size).toBe(used.length)
    expect(used.length).toBe(questions.length)
  })

  it('keeps mcq answers inside four choices', () => {
    for (const question of questions) {
      if (question.type !== 'mcq') continue
      expect(question.choices).toHaveLength(4)
      expect(question.choices.map((c) => c.id)).toContain(question.answerId)
    }
  })

  it('keeps match pairs aligned to left/right ids', () => {
    for (const question of questions) {
      if (question.type !== 'match') continue
      const left = new Set(question.left.map((item) => item.id))
      const right = new Set(question.right.map((item) => item.id))
      expect(Object.keys(question.pairs).sort()).toEqual([...left].sort())
      for (const value of Object.values(question.pairs)) {
        expect(right.has(value)).toBe(true)
      }
    }
  })

  it('keeps drag answers as permutations or valid bins', () => {
    for (const question of questions) {
      if (question.type === 'drag-order') {
        expect([...question.answer].sort()).toEqual([...question.items.map((i) => i.id)].sort())
      }
      if (question.type === 'drag-bins') {
        const slotIds = new Set(question.slots.map((s) => s.id))
        expect(Object.keys(question.answer).sort()).toEqual(
          [...question.items.map((i) => i.id)].sort(),
        )
        for (const slotId of Object.values(question.answer)) {
          expect(slotIds.has(slotId)).toBe(true)
        }
      }
    }
  })

  it('groups a single interaction type per stage', () => {
    for (const part of parts) {
      const types = part.stages.map((s) => s.type)
      expect(new Set(types).size).toBe(types.length)
    }
  })
})
