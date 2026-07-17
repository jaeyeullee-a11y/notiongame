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
  })

  it('accepts known season and weather values', () => {
    expect(SeasonSchema.parse('spring')).toBe('spring')
    expect(SeasonSchema.parse('summer')).toBe('summer')
    expect(SeasonSchema.parse('autumn')).toBe('autumn')
    expect(SeasonSchema.parse('winter')).toBe('winter')

    expect(WeatherTypeSchema.parse('clear')).toBe('clear')
    expect(WeatherTypeSchema.parse('rain')).toBe('rain')
    expect(WeatherTypeSchema.parse('snow')).toBe('snow')

    expect(() => SeasonSchema.parse('monsoon')).toThrow()
    expect(() => WeatherTypeSchema.parse('hail')).toThrow()
  })

  it('migrates v1 save payloads with default season/weather', () => {
    const save = createNewGardenSave('Legacy')
    const legacy: Record<string, unknown> = { ...save, schemaVersion: 1 }
    delete legacy.season
    delete legacy.weather

    const parsed = GardenSaveDataSchema.parse(legacy)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.season).toBe('spring')
    expect(parsed.weather).toBe('clear')
  })
})
