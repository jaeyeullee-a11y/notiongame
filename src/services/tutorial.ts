const STORAGE_KEY = 'runway-defense:tutorial-done'

export type TutorialStepId = 'runway' | 'place_developer' | 'start_wave' | 'earn_budget' | 'roles'

export const TUTORIAL_STEPS: Array<{ id: TutorialStepId; text: string }> = [
  {
    id: 'runway',
    text: '적이 Product Core에 도착하면 Runway가 감소합니다. 0이 되면 패배합니다.',
  },
  {
    id: 'place_developer',
    text: '빈 슬롯을 클릭하고 Developer를 배치하세요.',
  },
  {
    id: 'start_wave',
    text: '준비가 되면 Start Wave로 1웨이브를 시작하세요.',
  },
  {
    id: 'earn_budget',
    text: '적을 제거하면 Budget을 얻습니다. Budget으로 타워를 강화하세요.',
  },
  {
    id: 'roles',
    text: 'Developer는 Bug에 강하고, Designer는 빠른 적을 느리게 만듭니다.',
  },
]

export function hasCompletedTutorial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function markTutorialCompleted(): void {
  localStorage.setItem(STORAGE_KEY, '1')
}

export function resetTutorialProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}
