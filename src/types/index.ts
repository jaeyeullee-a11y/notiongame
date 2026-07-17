/**
 * Shared domain types for Runway Defense.
 */

export type TowerId = 'developer' | 'designer' | 'pm' | 'sales' | 'ai_agent' | 'founder'

export type EnemyId = 'bug' | 'urgent_request' | 'scope_creep' | 'churn_risk' | 'enterprise_client'

export type GameResult = 'won' | 'lost' | 'abandoned'

export type PlayPhase = 'ready' | 'combat' | 'paused' | 'won' | 'lost'

export type PlayEventType =
  | 'GameStarted'
  | 'WaveStarted'
  | 'WaveCleared'
  | 'TowerPlaced'
  | 'TowerUpgraded'
  | 'TowerSold'
  | 'EnemySpawned'
  | 'EnemyDefeated'
  | 'EnemyReachedCore'
  | 'RunwayChanged'
  | 'AbilityUsed'
  | 'GameWon'
  | 'GameLost'
  | 'VocSubmitted'

export interface SessionMeta {
  sessionId: string
  result?: GameResult
  reachedWave: number
  remainingRunway: number
  playTimeMs: number
  finalScore: number
  towersPlacedByType: Partial<Record<TowerId, number>>
  enemiesDefeated: number
  enemiesLeaked: number
  mostUsedTower?: TowerId
}

export interface PlayEvent {
  type: PlayEventType
  sessionId: string
  at: number
  wave: number
  budget: number
  runway: number
  payload?: Record<string, unknown>
}

export interface VocSubmission {
  sessionId: string
  text: string
  tags: string[]
  submittedAt: number
  meta: SessionMeta
}
