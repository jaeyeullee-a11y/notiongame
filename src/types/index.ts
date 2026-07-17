/**
 * Shared domain types for Runway Defense.
 * Game systems will consume these once gameplay is implemented.
 */

export type TowerId = 'developer' | 'designer' | 'pm' | 'sales' | 'ai_agent' | 'founder'

export type EnemyId = 'bug' | 'urgent_request' | 'scope_creep' | 'churn_risk' | 'enterprise_client'

export type GameResult = 'won' | 'lost' | 'abandoned'

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
}
