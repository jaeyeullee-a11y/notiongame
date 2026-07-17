import type { EnemyId, TowerId } from '@/types'
import { GAME } from './constants'

export type TargetRule = 'nearest_core' | 'fastest' | 'highest_reward' | 'lowest_hp' | 'none'

export interface TowerLevelStats {
  damage: number
  range: number
  attackIntervalMs: number
  cost: number
  supportRange?: number
}

export interface TowerDef {
  id: TowerId
  name: string
  role: string
  color: string
  targetRule: TargetRule
  maxCount?: number
  levels: [TowerLevelStats, TowerLevelStats, TowerLevelStats]
  bugBonusPct?: number
  hasSlow?: boolean
  isSupport?: boolean
  hasConvert?: boolean
  hasLearn?: boolean
  hasAllHands?: boolean
}

export const TOWERS: Record<TowerId, TowerDef> = {
  developer: {
    id: 'developer',
    name: 'Developer',
    role: 'Bug 추가 피해',
    color: '#4ea1ff',
    targetRule: 'nearest_core',
    bugBonusPct: 0.5,
    levels: [
      { damage: 14, range: 125, attackIntervalMs: 900, cost: 100 },
      { damage: 20, range: 135, attackIntervalMs: 820, cost: 80 },
      { damage: 28, range: 145, attackIntervalMs: 740, cost: 110 },
    ],
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    role: 'Slow 적용',
    color: '#c084fc',
    targetRule: 'fastest',
    hasSlow: true,
    levels: [
      { damage: 9, range: 130, attackIntervalMs: 1000, cost: 120 },
      { damage: 12, range: 140, attackIntervalMs: 920, cost: 90 },
      { damage: 16, range: 155, attackIntervalMs: 840, cost: 120 },
    ],
  },
  pm: {
    id: 'pm',
    name: 'PM',
    role: '주변 타워 버프',
    color: '#34d399',
    targetRule: 'none',
    isSupport: true,
    levels: [
      {
        damage: 0,
        range: 0,
        attackIntervalMs: 99999,
        cost: 150,
        supportRange: 140,
      },
      {
        damage: 0,
        range: 0,
        attackIntervalMs: 99999,
        cost: 100,
        supportRange: 155,
      },
      {
        damage: 0,
        range: 0,
        attackIntervalMs: 99999,
        cost: 140,
        supportRange: 170,
      },
    ],
  },
  sales: {
    id: 'sales',
    name: 'Sales',
    role: 'Converted 추가 Budget',
    color: '#fbbf24',
    targetRule: 'highest_reward',
    hasConvert: true,
    levels: [
      { damage: 11, range: 115, attackIntervalMs: 950, cost: 130 },
      { damage: 15, range: 125, attackIntervalMs: 880, cost: 95 },
      { damage: 21, range: 140, attackIntervalMs: 800, cost: 130 },
    ],
  },
  ai_agent: {
    id: 'ai_agent',
    name: 'AI Agent',
    role: '저체력 우선 · 학습',
    color: '#fb7185',
    targetRule: 'lowest_hp',
    hasLearn: true,
    levels: [
      { damage: 15, range: 125, attackIntervalMs: 980, cost: 180 },
      { damage: 21, range: 135, attackIntervalMs: 900, cost: 120 },
      { damage: 29, range: 150, attackIntervalMs: 820, cost: 160 },
    ],
  },
  founder: {
    id: 'founder',
    name: 'Founder',
    role: 'All Hands (1회)',
    color: '#f97316',
    targetRule: 'nearest_core',
    maxCount: 1,
    hasAllHands: true,
    levels: [
      { damage: 18, range: 150, attackIntervalMs: 850, cost: 250 },
      { damage: 24, range: 160, attackIntervalMs: 780, cost: 150 },
      { damage: 32, range: 175, attackIntervalMs: 700, cost: 200 },
    ],
  },
}

export const TOWER_ORDER: TowerId[] = [
  'developer',
  'designer',
  'pm',
  'sales',
  'ai_agent',
  'founder',
]

export function towerStats(id: TowerId, level: number): TowerLevelStats {
  const clamped = Math.min(Math.max(level, 1), GAME.MAX_TOWER_LEVEL)
  return TOWERS[id].levels[clamped - 1]!
}

export function learnAttackSpeedBonus(kills: number): number {
  if (kills >= 20) return 0.2
  if (kills >= 10) return 0.1
  if (kills >= 5) return 0.05
  return 0
}

export function isValidTowerTarget(enemyType: EnemyId, rule: TargetRule): boolean {
  if (rule === 'highest_reward' && enemyType === 'enterprise_client') return false
  return true
}
