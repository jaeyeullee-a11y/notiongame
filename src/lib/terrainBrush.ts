import theme from '@/data/theme.json'
import type { BrushShape, TerrainCell, TerrainTypeId } from '@/schemas/garden'

const { cols, rows } = theme.world

export function createEmptyTerrain(
  fill: TerrainTypeId = 'grass',
): TerrainCell[] {
  const cells: TerrainCell[] = []
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      cells.push({
        x,
        y,
        terrainTypeId: fill,
        variation: (x + y) % 2,
      })
    }
  }
  return cells
}

export function cellIndex(x: number, y: number): number {
  return y * cols + x
}

export function worldToCell(
  worldX: number,
  worldY: number,
): { x: number; y: number } | null {
  const x = Math.floor(worldX / theme.world.tileSize)
  const y = Math.floor(worldY / theme.world.tileSize)
  if (x < 0 || y < 0 || x >= cols || y >= rows) return null
  return { x, y }
}

export function getBrushCells(
  centerX: number,
  centerY: number,
  radius: number,
  shape: BrushShape,
  previousCell: { x: number; y: number } | null,
): Array<{ x: number; y: number }> {
  const center = worldToCell(centerX, centerY)
  if (!center) return []

  if (shape === 'path' && previousCell) {
    return lineCells(previousCell.x, previousCell.y, center.x, center.y, radius)
  }

  return diskCells(center.x, center.y, radius)
}

function diskCells(
  cx: number,
  cy: number,
  radius: number,
): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = []
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) {
        cells.push({ x, y })
      }
    }
  }
  return cells
}

function lineCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
): Array<{ x: number; y: number }> {
  const seen = new Set<string>()
  const result: Array<{ x: number; y: number }> = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0

  while (true) {
    for (const cell of diskCells(x, y, radius)) {
      const key = `${cell.x},${cell.y}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(cell)
      }
    }
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }

  return result
}

export function applyTerrainPaint(
  terrain: TerrainCell[],
  cells: Array<{ x: number; y: number }>,
  terrainTypeId: TerrainTypeId,
): { next: TerrainCell[]; previous: TerrainCell[] } {
  const next = terrain.map((cell) => ({ ...cell }))
  const previous: TerrainCell[] = []

  for (const { x, y } of cells) {
    const index = cellIndex(x, y)
    const current = next[index]
    if (!current) continue
    previous.push({ ...current })
    next[index] = {
      ...current,
      terrainTypeId,
      variation: (x + y + (terrainTypeId === 'grass' ? 0 : 1)) % 2,
    }
  }

  return { next, previous }
}
