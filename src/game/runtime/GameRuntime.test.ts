import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GAME } from '@/data/constants'
import { PATH_TOTAL_LENGTH } from '@/data/map'
import { GameRuntime } from './GameRuntime'

describe('GameRuntime', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    })
  })

  it('starts with default runway and budget', () => {
    const runtime = new GameRuntime()
    const snap = runtime.getSnapshot()
    expect(snap.runway).toBe(GAME.START_RUNWAY)
    expect(snap.budget).toBe(GAME.START_BUDGET)
    expect(snap.phase).toBe('ready')
  })

  it('places a developer tower and spends budget', () => {
    const runtime = new GameRuntime()
    const ok = runtime.placeTower('s1', 'developer')
    expect(ok).toBe(true)
    expect(runtime.budget).toBe(GAME.START_BUDGET - 100)
    expect(runtime.towers).toHaveLength(1)
  })

  it('rejects placing a second founder', () => {
    const runtime = new GameRuntime()
    expect(runtime.placeTower('s1', 'founder')).toBe(true)
    expect(runtime.placeTower('s2', 'founder')).toBe(false)
  })

  it('sells a tower with 70% refund', () => {
    const runtime = new GameRuntime()
    runtime.placeTower('s1', 'developer')
    const towerId = runtime.towers[0]!.id
    const before = runtime.budget
    runtime.sellTower(towerId)
    expect(runtime.towers).toHaveLength(0)
    expect(runtime.budget).toBe(before + Math.floor(100 * GAME.SELL_REFUND_RATE))
  })

  it('starts a wave and transitions to combat', () => {
    const runtime = new GameRuntime()
    expect(runtime.startWave()).toBe(true)
    expect(runtime.getSnapshot().phase).toBe('combat')
    expect(runtime.startWave()).toBe(false)
  })

  it('ends in loss when runway is depleted by a leak', () => {
    const runtime = new GameRuntime()
    runtime.runway = 1
    runtime.startWave()
    runtime.enemies.push({
      id: 'leak',
      type: 'bug',
      hp: 10,
      maxHp: 10,
      distance: PATH_TOTAL_LENGTH,
      x: 0,
      y: 0,
      alive: true,
      converted: false,
      slowUntil: 0,
      freezeUntil: 0,
      baseSpeed: 50,
      leaked: false,
    })
    runtime.update(100)
    expect(runtime.getSnapshot().phase).toBe('lost')
    expect(runtime.runway).toBe(0)
  })
})
