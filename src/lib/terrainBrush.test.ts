import { describe, expect, it } from 'vitest'
import {
  applyTerrainPaint,
  createEmptyTerrain,
  getBrushCells,
} from '@/lib/terrainBrush'

describe('terrainBrush', () => {
  it('creates a full grass grid', () => {
    const terrain = createEmptyTerrain('grass')
    expect(terrain).toHaveLength(38 * 25)
    expect(terrain.every((cell) => cell.terrainTypeId === 'grass')).toBe(true)
  })

  it('paints a round brush disk', () => {
    const cells = getBrushCells(320, 320, 2, 'round', null)
    expect(cells.length).toBeGreaterThan(4)
    const terrain = createEmptyTerrain('grass')
    const { next, previous } = applyTerrainPaint(terrain, cells, 'water')
    expect(previous.length).toBe(cells.length)
    expect(
      next.filter((cell) => cell.terrainTypeId === 'water').length,
    ).toBe(cells.length)
  })

  it('path brush connects previous cell', () => {
    const cells = getBrushCells(640, 320, 1, 'path', { x: 5, y: 5 })
    expect(cells.length).toBeGreaterThan(1)
  })
})
