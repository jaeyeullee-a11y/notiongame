import { describe, expect, it } from 'vitest'
import { assetsById } from '@/lib/assets'
import { hitTestObjects } from '@/lib/hitTest'
import type { PlacedGardenObject } from '@/schemas/garden'

function oak(
  instanceId: string,
  x: number,
  y: number,
  sortOffset = 0,
): PlacedGardenObject {
  return {
    instanceId,
    assetId: 'young-oak',
    x,
    y,
    rotation: 0,
    scale: 1,
    flipX: false,
    sortOffset,
  }
}

describe('hitTestObjects', () => {
  it('returns the object when the point is inside its footprint', () => {
    const hit = hitTestObjects(100, 200, [oak('oak-1', 100, 200)], assetsById)
    expect(hit?.instanceId).toBe('oak-1')
  })

  it('returns null when the point is outside every footprint', () => {
    const hit = hitTestObjects(400, 400, [oak('oak-1', 100, 200)], assetsById)
    expect(hit).toBeNull()
  })

  it('returns null when the garden has no objects', () => {
    expect(hitTestObjects(0, 0, [], assetsById)).toBeNull()
  })

  it('prefers the topmost overlapping object', () => {
    const hit = hitTestObjects(
      100,
      200,
      [oak('lower', 100, 200, 0), oak('upper', 100, 200, 40)],
      assetsById,
    )
    expect(hit?.instanceId).toBe('upper')
  })
})
