import { describe, expect, it, test } from 'vitest'
import { assetsById, gardenAssets, searchAssets } from '@/lib/assets'
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
  test.each(['cherry-blossom', 'fountain'])(
    '에셋 %s가 assetsById에 존재한다',
    (id) => {
      expect(assetsById.has(id)).toBe(true)
    },
  )

  test('모든 에셋이 GardenAssetDefinitionSchema를 통과한다', () => {
    expect(gardenAssets.length).toBeGreaterThan(0)
    for (const asset of gardenAssets) {
      expect(assetsById.get(asset.id)).toEqual(asset)
    }
  })

  test('trees 카테고리에 최소 4종 에셋이 있다', () => {
    const count = gardenAssets.filter((a) => a.category === 'trees').length
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('features 카테고리에 최소 4종 에셋이 있다', () => {
    const count = gardenAssets.filter((a) => a.category === 'features').length
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('총 에셋 수가 20종 이상이다', () => {
    expect(gardenAssets.length).toBeGreaterThanOrEqual(20)
  })

  test('cherry-blossom은 spring/blossom 태그로 검색된다', () => {
    const byCherry = searchAssets('cherry')
    const bySpring = searchAssets('spring')
    expect(byCherry.some((a) => a.id === 'cherry-blossom')).toBe(true)
    expect(bySpring.some((a) => a.id === 'cherry-blossom')).toBe(true)
  })

  test('fountain은 fountain/water 태그로 검색된다', () => {
    const byFountain = searchAssets('fountain')
    const byWater = searchAssets('water')
    expect(byFountain.some((a) => a.id === 'fountain')).toBe(true)
    expect(byWater.some((a) => a.id === 'fountain')).toBe(true)
  })

  test('fountain은 sortOffset 8 이상이며 회전/반전이 비활성이다', () => {
    const fountain = assetsById.get('fountain')
    expect(fountain).toBeDefined()
    expect(fountain!.sortOffset).toBeGreaterThanOrEqual(8)
    expect(fountain!.canRotate).toBe(false)
    expect(fountain!.canFlip).toBe(false)
  })
})
