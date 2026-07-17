import type { EnemyId } from '@/types'
import { GAME } from './constants'

export interface WaveSpawnGroup {
  enemyId: EnemyId
  count: number
  intervalMs: number
  startDelayMs?: number
}

export interface WaveDef {
  wave: number
  clearBonus?: number
  spawns: WaveSpawnGroup[]
  introEnemy?: EnemyId
}

export const WAVES: WaveDef[] = [
  {
    wave: 1,
    spawns: [{ enemyId: 'bug', count: 8, intervalMs: 900, startDelayMs: 400 }],
  },
  {
    wave: 2,
    spawns: [{ enemyId: 'bug', count: 12, intervalMs: 750 }],
  },
  {
    wave: 3,
    introEnemy: 'urgent_request',
    spawns: [
      { enemyId: 'bug', count: 8, intervalMs: 800 },
      { enemyId: 'urgent_request', count: 5, intervalMs: 700, startDelayMs: 1200 },
    ],
  },
  {
    wave: 4,
    spawns: [
      { enemyId: 'bug', count: 10, intervalMs: 700 },
      { enemyId: 'urgent_request', count: 7, intervalMs: 650, startDelayMs: 800 },
    ],
  },
  {
    wave: 5,
    introEnemy: 'scope_creep',
    spawns: [
      { enemyId: 'bug', count: 8, intervalMs: 700 },
      { enemyId: 'urgent_request', count: 5, intervalMs: 650, startDelayMs: 600 },
      { enemyId: 'scope_creep', count: 3, intervalMs: 1400, startDelayMs: 1500 },
    ],
  },
  {
    wave: 6,
    spawns: [
      { enemyId: 'bug', count: 10, intervalMs: 650 },
      { enemyId: 'urgent_request', count: 6, intervalMs: 600, startDelayMs: 500 },
      { enemyId: 'scope_creep', count: 4, intervalMs: 1200, startDelayMs: 1000 },
    ],
  },
  {
    wave: 7,
    introEnemy: 'churn_risk',
    spawns: [
      { enemyId: 'urgent_request', count: 8, intervalMs: 600 },
      { enemyId: 'scope_creep', count: 4, intervalMs: 1100, startDelayMs: 800 },
      { enemyId: 'churn_risk', count: 3, intervalMs: 1600, startDelayMs: 1600 },
    ],
  },
  {
    wave: 8,
    spawns: [
      { enemyId: 'bug', count: 12, intervalMs: 550 },
      { enemyId: 'churn_risk', count: 4, intervalMs: 1400, startDelayMs: 700 },
      { enemyId: 'scope_creep', count: 4, intervalMs: 1000, startDelayMs: 900 },
    ],
  },
  {
    wave: 9,
    spawns: [
      { enemyId: 'urgent_request', count: 10, intervalMs: 520 },
      { enemyId: 'churn_risk', count: 5, intervalMs: 1200, startDelayMs: 600 },
      { enemyId: 'scope_creep', count: 5, intervalMs: 1000, startDelayMs: 800 },
    ],
  },
  {
    wave: 10,
    introEnemy: 'enterprise_client',
    spawns: [
      { enemyId: 'bug', count: 10, intervalMs: 500 },
      { enemyId: 'churn_risk', count: 4, intervalMs: 1100, startDelayMs: 500 },
      { enemyId: 'scope_creep', count: 3, intervalMs: 1200, startDelayMs: 900 },
      {
        enemyId: 'enterprise_client',
        count: 1,
        intervalMs: 1000,
        startDelayMs: 2500,
      },
    ],
  },
]

export function getWave(wave: number): WaveDef {
  const def = WAVES.find((w) => w.wave === wave)
  if (!def) throw new Error(`Unknown wave ${wave}`)
  return def
}

export function waveEnemyTotal(wave: number): number {
  return getWave(wave).spawns.reduce((sum, g) => sum + g.count, 0)
}

export function waveClearBonus(wave: number): number {
  return getWave(wave).clearBonus ?? GAME.WAVE_CLEAR_BONUS
}
