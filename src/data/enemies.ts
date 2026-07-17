import type { EnemyId } from '@/types'

export interface EnemyDef {
  id: EnemyId
  name: string
  color: string
  hp: number
  speed: number
  reward: number
  runwayDamage: number
  isBoss?: boolean
  hasSpeedAura?: boolean
  slowResist?: number
  convertImmune?: boolean
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  bug: {
    id: 'bug',
    name: 'Bug',
    color: '#ef4444',
    hp: 42,
    speed: 62,
    reward: 8,
    runwayDamage: 1,
  },
  urgent_request: {
    id: 'urgent_request',
    name: 'Urgent Request',
    color: '#f59e0b',
    hp: 32,
    speed: 115,
    reward: 10,
    runwayDamage: 1,
  },
  scope_creep: {
    id: 'scope_creep',
    name: 'Scope Creep',
    color: '#a855f7',
    hp: 90,
    speed: 52,
    reward: 16,
    runwayDamage: 2,
    hasSpeedAura: true,
  },
  churn_risk: {
    id: 'churn_risk',
    name: 'Churn Risk',
    color: '#64748b',
    hp: 140,
    speed: 48,
    reward: 24,
    runwayDamage: 3,
  },
  enterprise_client: {
    id: 'enterprise_client',
    name: 'Enterprise Client',
    color: '#0ea5e9',
    hp: 900,
    speed: 34,
    reward: 120,
    runwayDamage: 5,
    isBoss: true,
    slowResist: 0.5,
    convertImmune: true,
  },
}
