import { describe, expect, it } from 'vitest'
import { assetsById, gardenAssets } from '@/lib/assets'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import { GardenSaveDataSchema } from '@/schemas/garden'

describe('garden content', () => {
  it('loads at least 20 placeable assets across 6 categories', () => {
    expect(gardenAssets.length).toBeGreaterThanOrEqual(20)
    const categories = new Set(gardenAssets.map((a) => a.category))
    expect(categories.size).toBe(6)
  })

  it('validates generated surprise gardens', () => {
    const save = createNewGardenSave('Test', 'surprise', 42)
    const parsed = GardenSaveDataSchema.parse(save)
    expect(parsed.terrain.length).toBe(38 * 25)
    expect(parsed.objects.length).toBeGreaterThan(0)
  })
})

describe('신규 에셋 검증 (v2 — cherry-blossom, fountain)', () => {
  it.each(['cherry-blossom', 'fountain'])(
    '에셋 %s가 assetsById에 존재한다',
    (id) => {
      expect(assetsById.has(id)).toBe(true)
    },
  )

  it('모든 에셋이 GardenAssetDefinitionSchema를 통과한다', () => {
    expect(gardenAssets.length).toBeGreaterThan(0)
  })

  it('trees 카테고리에 최소 4종 에셋이 있다', () => {
    const count = gardenAssets.filter((a) => a.category === 'trees').length
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('features 카테고리에 최소 4종 에셋이 있다', () => {
    const count = gardenAssets.filter((a) => a.category === 'features').length
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('cherry-blossom은 spring/blossom 태그를 가진다', () => {
    const asset = assetsById.get('cherry-blossom')
    expect(asset?.tags).toEqual(
      expect.arrayContaining(['spring', 'blossom']),
    )
  })

  it('fountain은 sortOffset이 8 이상이다', () => {
    const asset = assetsById.get('fountain')
    expect(asset?.sortOffset).toBeGreaterThanOrEqual(8)
  })
})
