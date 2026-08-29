export type Difficulty = 'easy' | 'medium' | 'hard'

export type McqChoice = {
  id: string
  text: string
}

export type McqQuestion = {
  id: string
  type: 'mcq'
  difficulty: Difficulty
  prompt: string
  choices: McqChoice[]
  answerId: string
  explain: string
  image?: string
}

export type MatchItem = {
  id: string
  text: string
}

export type MatchQuestion = {
  id: string
  type: 'match'
  difficulty: Difficulty
  prompt: string
  left: MatchItem[]
  right: MatchItem[]
  pairs: Record<string, string>
  explain: string
  image?: string
}

export type DragItem = {
  id: string
  text: string
}

export type DragSlot = {
  id: string
  label: string
  hint?: string
}

export type DragOrderQuestion = {
  id: string
  type: 'drag-order'
  difficulty: Difficulty
  prompt: string
  items: DragItem[]
  answer: string[]
  explain: string
  image?: string
}

export type DragBinsQuestion = {
  id: string
  type: 'drag-bins'
  difficulty: Difficulty
  prompt: string
  items: DragItem[]
  slots: DragSlot[]
  answer: Record<string, string>
  explain: string
  image?: string
}

export type Question = McqQuestion | MatchQuestion | DragOrderQuestion | DragBinsQuestion

export type StageType = Question['type']

export type Stage = {
  id: string
  type: StageType
  title: string
  blurb: string
  questionIds: string[]
}

export type Part = {
  id: string
  number: number
  title: string
  summary: string
  stages: Stage[]
}

export type McqResponse = { type: 'mcq'; choiceId: string }
export type MatchResponse = { type: 'match'; mapping: Record<string, string> }
export type DragOrderResponse = { type: 'drag-order'; order: string[] }
export type DragBinsResponse = { type: 'drag-bins'; placement: Record<string, string> }
export type QuestionResponse = McqResponse | MatchResponse | DragOrderResponse | DragBinsResponse

export type ScoreResult = {
  earned: number
  max: number
  correct: boolean
}
