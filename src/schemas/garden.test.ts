import { describe, expect, it, test } from 'vitest'
import { assetsById, gardenAssets, searchAssets } from '@/lib/assets'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import { GardenSaveDataSchema } from '@/schemas/garden'

function baseSaveSettings(overrides: Record<string, unknown> = {}) {
  return {
    musicEnabled: true,
    ambienceEnabled: true,
    musicVolume: 0.45,
    ambienceVolume: 0.35,
    ...overrides,
  }
}

function minimalSave(settings: Record<string, unknown>) {
  return {
    schemaVersion: 1 as const,
    id: 'garden-test',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    world: { width: 2400 as const, height: 1600 as const },
    camera: { x: 0, y: 0, zoom: 1 },
    terrain: [],
    objects: [],
    settings,
    metadata: { objectCount: 0, playTimeSeconds: 0 },
  }
}

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

describe('야간 모드 settings.timeOfDay', () => {
  it('timeOfDay 없는 v1 저장 데이터는 day 기본값을 적용한다', () => {
    const parsed = GardenSaveDataSchema.parse(
      minimalSave(baseSaveSettings()),
    )
    expect(parsed.settings.timeOfDay).toBe('day')
  })

  it('timeOfDay: night를 올바르게 parse한다', () => {
    const parsed = GardenSaveDataSchema.parse(
      minimalSave(baseSaveSettings({ timeOfDay: 'night' })),
    )
    expect(parsed.settings.timeOfDay).toBe('night')
  })

  it('timeOfDay: invalid 입력 시 Zod 밸리데이션 에러가 발생한다', () => {
    const result = GardenSaveDataSchema.safeParse(
      minimalSave(baseSaveSettings({ timeOfDay: 'invalid' })),
    )
    expect(result.success).toBe(false)
  })

  it('신규 정원 기본 settings에 timeOfDay: day가 포함된다', () => {
    const save = createNewGardenSave('Night Test', 'empty')
    expect(save.settings.timeOfDay).toBe('day')
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

describe('조명 에셋 검증 (야간 모드)', () => {
  test.each(['garden-lantern', 'street-light', 'candle-lantern'])(
    '에셋 %s가 assetsById에 존재하고 luminous 태그를 갖는다',
    (id) => {
      const asset = assetsById.get(id)
      expect(asset).toBeDefined()
      expect(asset!.tags).toContain('luminous')
      expect(asset!.tags).toContain('light')
    },
  )

  test('street-light는 structures 카테고리이다', () => {
    expect(assetsById.get('street-light')?.category).toBe('structures')
  })

  test('candle-lantern은 features 카테고리이다', () => {
    expect(assetsById.get('candle-lantern')?.category).toBe('features')
  })

  test('luminous 태그로 조명 에셋을 검색할 수 있다', () => {
    const luminous = searchAssets('luminous')
    expect(luminous.some((a) => a.id === 'garden-lantern')).toBe(true)
    expect(luminous.some((a) => a.id === 'street-light')).toBe(true)
    expect(luminous.some((a) => a.id === 'candle-lantern')).toBe(true)
  })
})
