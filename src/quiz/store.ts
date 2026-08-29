import { create } from 'zustand'
import type { QuestionResponse } from '@/quiz/types'

const STORAGE_KEY = 'workshop-quiz.v1'

type Persisted = {
  responses: Record<string, QuestionResponse>
}

type QuizState = {
  responses: Record<string, QuestionResponse>
  hydrated: boolean
  hydrate: () => void
  setResponse: (questionId: string, response: QuestionResponse) => void
  clearQuestion: (questionId: string) => void
  resetAll: () => void
}

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { responses: {} }
    const parsed = JSON.parse(raw) as Persisted
    return { responses: parsed.responses ?? {} }
  } catch {
    return { responses: {} }
  }
}

function write(responses: Record<string, QuestionResponse>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ responses }))
}

export const useQuizStore = create<QuizState>((set, get) => ({
  responses: {},
  hydrated: false,
  hydrate: () => {
    set({ ...read(), hydrated: true })
  },
  setResponse: (questionId, response) => {
    const responses = { ...get().responses, [questionId]: response }
    write(responses)
    set({ responses })
  },
  clearQuestion: (questionId) => {
    const responses = { ...get().responses }
    delete responses[questionId]
    write(responses)
    set({ responses })
  },
  resetAll: () => {
    write({})
    set({ responses: {} })
  },
}))
