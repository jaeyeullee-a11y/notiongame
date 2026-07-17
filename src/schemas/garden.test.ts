import { describe, expect, it } from 'vitest'
import { gardenAssets } from '@/lib/assets'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import { GardenSaveDataSchema } from '@/schemas/garden'

describe('garden content', () => {
  it('loads exactly 18 placeable assets across 6 categories', () => {
    expect(gardenAssets).toHaveLength(18)
    const categories = new Set(gardenAssets.map((a) => a.category))
    expect(categories.size).toBe(6)
    for (const category of categories) {
      expect(gardenAssets.filter((a) => a.category === category)).toHaveLength(3)
    }
  })

  it('validates generated surprise gardens', () => {
    const save = createNewGardenSave('Test', 'surprise', 42)
    const parsed = GardenSaveDataSchema.parse(save)
    expect(parsed.terrain.length).toBe(38 * 25)
    expect(parsed.objects.length).toBeGreaterThan(0)
  })
})
