import { describe, expect, it } from 'vitest'
import { pickTarget, type TargetableEnemy } from './targeting'

function enemy(
  partial: Partial<TargetableEnemy> & Pick<TargetableEnemy, 'id' | 'type'>,
): TargetableEnemy {
  return {
    x: 0,
    y: 0,
    hp: 50,
    maxHp: 50,
    baseSpeed: 50,
    distance: 10,
    alive: true,
    ...partial,
  }
}

describe('pickTarget', () => {
  it('picks nearest to core for developer', () => {
    const enemies = [
      enemy({ id: 'a', type: 'bug', x: 10, y: 0, distance: 20 }),
      enemy({ id: 'b', type: 'bug', x: 10, y: 0, distance: 80 }),
    ]
    const target = pickTarget('developer', 0, 0, 100, enemies)
    expect(target?.id).toBe('b')
  })

  it('picks fastest for designer', () => {
    const enemies = [
      enemy({ id: 'a', type: 'bug', x: 5, y: 0, baseSpeed: 40 }),
      enemy({ id: 'b', type: 'urgent_request', x: 5, y: 0, baseSpeed: 120 }),
    ]
    const target = pickTarget('designer', 0, 0, 100, enemies)
    expect(target?.id).toBe('b')
  })

  it('skips enterprise for sales reward targeting', () => {
    const enemies = [
      enemy({ id: 'boss', type: 'enterprise_client', x: 5, y: 0 }),
      enemy({ id: 'bug', type: 'bug', x: 5, y: 0 }),
    ]
    const target = pickTarget('sales', 0, 0, 100, enemies)
    expect(target?.id).toBe('bug')
  })
})
