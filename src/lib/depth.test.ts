import { describe, expect, it } from 'vitest'
import { getSortKey, sortObjectsByDepth } from '@/lib/depth'
import type { PlacedGardenObject } from '@/schemas/garden'

function obj(
  instanceId: string,
  y: number,
  sortOffset = 0,
): PlacedGardenObject {
  return {
    instanceId,
    assetId: 'young-oak',
    x: 0,
    y,
    rotation: 0,
    scale: 1,
    flipX: false,
    sortOffset,
  }
}

describe('depth sorting', () => {
  it('sorts by y + sortOffset', () => {
    const sorted = sortObjectsByDepth([obj('a', 100), obj('b', 50, 60), obj('c', 80)])
    expect(sorted.map((o) => o.instanceId)).toEqual(['c', 'a', 'b'])
    expect(getSortKey(obj('x', 10, 5))).toBe(15)
  })
})
