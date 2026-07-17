import { describe, expect, it } from 'vitest'
import { gardenAssets } from '@/lib/assets'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import {
  GardenSaveDataSchema,
  SeasonSchema,
  WeatherTypeSchema,
} from '@/schemas/garden'

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
