import type { EnemyId, TowerId } from '@/types'
import type { TargetRule } from '@/data/towers'
import { TOWERS } from '@/data/towers'
import { ENEMIES } from '@/data/enemies'
import { PATH_TOTAL_LENGTH } from '@/data/map'

export interface TargetableEnemy {
  id: string
  type: EnemyId
  x: number
  y: number
  hp: number
  maxHp: number
  baseSpeed: number
  distance: number
  alive: boolean
}

export function pickTarget(
  towerType: TowerId,
  towerX: number,
  towerY: number,
  range: number,
  enemies: TargetableEnemy[],
): TargetableEnemy | null {
  const rule: TargetRule = TOWERS[towerType].targetRule
  if (rule === 'none') return null

  const inRange = enemies.filter((e) => {
    if (!e.alive) return false
    const dist = Math.hypot(e.x - towerX, e.y - towerY)
    if (dist > range) return false
    if (rule === 'highest_reward' && e.type === 'enterprise_client') return false
    return true
  })

  if (inRange.length === 0) return null

  switch (rule) {
    case 'nearest_core':
      return inRange.reduce((best, cur) =>
        PATH_TOTAL_LENGTH - cur.distance < PATH_TOTAL_LENGTH - best.distance ? cur : best,
      )
    case 'fastest':
      return inRange.reduce((best, cur) => (cur.baseSpeed > best.baseSpeed ? cur : best))
    case 'highest_reward':
      return inRange.reduce((best, cur) =>
        ENEMIES[cur.type].reward > ENEMIES[best.type].reward ? cur : best,
      )
    case 'lowest_hp':
      return inRange.reduce((best, cur) => (cur.hp < best.hp ? cur : best))
    default:
      return inRange[0] ?? null
  }
}
