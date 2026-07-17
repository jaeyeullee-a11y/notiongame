import { describe, expect, it } from 'vitest'
import { assetsById } from '@/lib/assets'
import { hitTestObjects } from '@/lib/hitTest'
import type { PlacedGardenObject } from '@/schemas/garden'

describe('hitTestObjects', () => {
  it('selects fountain on a normal click within visible basin area', () => {
    const fountain: PlacedGardenObject = {
      instanceId: 'obj_fountain',
      assetId: 'fountain',
      x: 500,
      y: 600,
      rotation: 0,
      scale: 1,
      flipX: false,
      sortOffset: 8,
    }

    // Visible basin/body area for the fountain sprite (not just ground contact).
    const hit = hitTestObjects(535, 555, [fountain], assetsById)
    expect(hit?.instanceId).toBe('obj_fountain')
  })
})
