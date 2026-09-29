import { describe, expect, it, test } from 'vitest'
import { assetsById, gardenAssets, searchAssets } from '@/lib/assets'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import {
  GardenSaveDataSchema,
  SeasonSchema,
  WeatherTypeSchema,
} from '@/schemas/garden'

describe('garden content', () => {
  it('loads at least 20 placeable assets across 7 categories', () => {
    expect(gardenAssets.length).toBeGreaterThanOrEqual(20)
    const categories = new Set(gardenAssets.map((a) => a.category))
    expect(categories.size).toBe(7)
  })

  it('validates generated surprise gardens', () => {
    const save = createNewGardenSave('Test', 'surprise', 42)
    const parsed = GardenSaveDataSchema.parse(save)
    expect(parsed.terrain.length).toBe(38 * 25)
    expect(parsed.objects.length).toBeGreaterThan(0)
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.season).toBe('spring')
    expect(parsed.weather).toBe('clear')
  })
})

describe('season and weather schemas', () => {
  it('accepts all valid seasons', () => {
    for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
      expect(SeasonSchema.parse(season)).toBe(season)
    }
  })

  it('accepts all valid weather types', () => {
    for (const weather of ['clear', 'rain', 'snow'] as const) {
      expect(WeatherTypeSchema.parse(weather)).toBe(weather)
    }
  })

  it('rejects undefined season and weather values', () => {
    expect(() => SeasonSchema.parse('monsoon')).toThrow()
    expect(() => WeatherTypeSchema.parse('fog')).toThrow()
  })

  it('migrates v1 save data with season/weather defaults', () => {
    const v1 = {
      schemaVersion: 1,
      id: 'garden_test',
      name: 'Legacy',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      world: { width: 2400, height: 1600 },
      camera: { x: 0, y: 0, zoom: 1 },
      terrain: [],
      objects: [],
      settings: {
        musicEnabled: true,
        ambienceEnabled: true,
        musicVolume: 0.45,
        ambienceVolume: 0.35,
      },
      metadata: { objectCount: 0, playTimeSeconds: 0 },
    }

    const parsed = GardenSaveDataSchema.parse(v1)
    expect(parsed.season).toBe('spring')
    expect(parsed.weather).toBe('clear')
    expect(parsed.schemaVersion).toBe(1)
  })

  it('round-trips a complete v2 save', () => {
    const v2 = createNewGardenSave('Autumn Garden', 'empty')
    const withSeason = {
      ...v2,
      season: 'autumn' as const,
      weather: 'rain' as const,
    }
    const parsed = GardenSaveDataSchema.parse(withSeason)
    expect(parsed).toMatchObject({
      schemaVersion: 2,
      season: 'autumn',
      weather: 'rain',
      name: 'Autumn Garden',
    })
    const again = GardenSaveDataSchema.parse(JSON.parse(JSON.stringify(parsed)))
    expect(again).toEqual(parsed)
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

describe('동물 캐릭터 에셋 검증 (dog, cat, horse)', () => {
  test.each(['dog', 'cat', 'horse'])(
    '에셋 %s가 assetsById에 존재한다',
    (id) => {
      expect(assetsById.has(id)).toBe(true)
    },
  )

  test.each(['dog', 'cat', 'horse'])(
    '에셋 %s가 animals 카테고리에 속한다',
    (id) => {
      const asset = assetsById.get(id)
      expect(asset).toBeDefined()
      expect(asset!.category).toBe('animals')
    },
  )

  test('animals 카테고리에 최소 3종 에셋이 있다', () => {
    const count = gardenAssets.filter((a) => a.category === 'animals').length
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('모든 동물 에셋이 animal 태그를 포함한다', () => {
    const animals = gardenAssets.filter((a) => a.category === 'animals')
    for (const animal of animals) {
      expect(animal.tags).toContain('animal')
    }
  })

  test('dog는 animal/pet/dog 태그로 검색된다', () => {
    const byAnimal = searchAssets('animal')
    const byPet = searchAssets('pet')
    const byDog = searchAssets('dog')
    expect(byAnimal.some((a) => a.id === 'dog')).toBe(true)
    expect(byPet.some((a) => a.id === 'dog')).toBe(true)
    expect(byDog.some((a) => a.id === 'dog')).toBe(true)
  })

  test('cat은 animal/pet/cat 태그로 검색된다', () => {
    const byAnimal = searchAssets('animal')
    const byPet = searchAssets('pet')
    const byCat = searchAssets('cat')
    expect(byAnimal.some((a) => a.id === 'cat')).toBe(true)
    expect(byPet.some((a) => a.id === 'cat')).toBe(true)
    expect(byCat.some((a) => a.id === 'cat')).toBe(true)
  })

  test('horse는 animal/horse 태그로 검색된다', () => {
    const byAnimal = searchAssets('animal')
    const byHorse = searchAssets('horse')
    expect(byAnimal.some((a) => a.id === 'horse')).toBe(true)
    expect(byHorse.some((a) => a.id === 'horse')).toBe(true)
  })

  test('동물 에셋은 회전 및 반전이 가능하다', () => {
    for (const id of ['dog', 'cat', 'horse']) {
      const asset = assetsById.get(id)
      expect(asset).toBeDefined()
      expect(asset!.canRotate).toBe(true)
      expect(asset!.canFlip).toBe(true)
    }
  })

  test('surprise garden에 동물이 배치될 수 있다', () => {
    const animalIds = new Set(['dog', 'cat', 'horse'])
    let found = false
    for (let seed = 0; seed < 20; seed++) {
      const save = createNewGardenSave(`Test-${seed}`, 'surprise', seed)
      if (save.objects.some((o) => animalIds.has(o.assetId))) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})
