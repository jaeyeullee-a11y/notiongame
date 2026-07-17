import { Container, Graphics } from 'pixi.js'
import theme from '@/data/theme.json'
import terrainData from '@/data/terrain.json'
import type { TerrainCell, TerrainTypeId } from '@/schemas/garden'

const COLORS: Record<TerrainTypeId, { base: string; alt: string }> = {
  grass: { base: '#789267', alt: '#6F8A5C' },
  soil: { base: '#8A6951', alt: '#7A5B45' },
  stone: { base: '#AAA698', alt: '#9C978A' },
  water: { base: '#739BA2', alt: '#668E96' },
}

export class TerrainRenderer {
  readonly container = new Container()
  private readonly tiles = new Graphics()
  private readonly edges = new Graphics()
  private readonly waterOverlay = new Graphics()
  private ripplePhase = 0

  constructor() {
    this.container.addChild(this.tiles, this.edges, this.waterOverlay)
    this.container.label = 'terrain'
  }

  render(terrain: TerrainCell[]): void {
    const { tileSize, cols, rows } = theme.world
    this.tiles.clear()
    this.edges.clear()

    const grid: TerrainTypeId[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 'grass' as TerrainTypeId),
    )
    const variations: number[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0),
    )

    for (const cell of terrain) {
      if (cell.y >= 0 && cell.y < rows && cell.x >= 0 && cell.x < cols) {
        grid[cell.y]![cell.x] = cell.terrainTypeId
        variations[cell.y]![cell.x] = cell.variation
      }
    }

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const type = grid[y]![x]!
        const colors = COLORS[type]
        const color = variations[y]![x] === 0 ? colors.base : colors.alt
        this.tiles.rect(x * tileSize, y * tileSize, tileSize, tileSize)
        this.tiles.fill({ color })

        // Soft noise speckles
        if (type === 'grass' || type === 'soil') {
          this.tiles.circle(
            x * tileSize + 16 + ((x * 13 + y * 7) % 28),
            y * tileSize + 18 + ((x * 5 + y * 11) % 24),
            2,
          )
          this.tiles.fill({ color: type === 'grass' ? '#A8B889' : '#6e5240', alpha: 0.25 })
        }
        if (type === 'stone') {
          this.tiles.roundRect(
            x * tileSize + 10,
            y * tileSize + 12,
            20,
            14,
            4,
          )
          this.tiles.fill({ color: '#C4C0B4', alpha: 0.35 })
        }
      }
    }

    // Soft edge overlays between different terrain types
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const type = grid[y]![x]!
        const neighbors = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ]
        for (const { dx, dy } of neighbors) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const other = grid[ny]![nx]!
          if (other === type) continue
          const color = COLORS[type].base
          if (dx === 1) {
            this.edges.rect((x + 1) * tileSize - 8, y * tileSize, 8, tileSize)
          } else if (dx === -1) {
            this.edges.rect(x * tileSize, y * tileSize, 8, tileSize)
          } else if (dy === 1) {
            this.edges.rect(x * tileSize, (y + 1) * tileSize - 8, tileSize, 8)
          } else {
            this.edges.rect(x * tileSize, y * tileSize, tileSize, 8)
          }
          this.edges.fill({ color, alpha: 0.35 })
        }
      }
    }

    void terrainData
    this.drawWaterRipples(grid, 0)
  }

  update(deltaSeconds: number, terrain: TerrainCell[]): void {
    this.ripplePhase += deltaSeconds * 0.6
    const { cols, rows } = theme.world
    const grid: TerrainTypeId[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 'grass' as TerrainTypeId),
    )
    for (const cell of terrain) {
      if (cell.y >= 0 && cell.y < rows && cell.x >= 0 && cell.x < cols) {
        grid[cell.y]![cell.x] = cell.terrainTypeId
      }
    }
    this.drawWaterRipples(grid, this.ripplePhase)
  }

  private drawWaterRipples(grid: TerrainTypeId[][], phase: number): void {
    const { tileSize, cols, rows } = theme.world
    this.waterOverlay.clear()
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (grid[y]![x] !== 'water') continue
        const px = x * tileSize + tileSize / 2
        const py = y * tileSize + tileSize / 2
        const pulse = 0.15 + 0.1 * Math.sin(phase + x * 0.7 + y * 0.5)
        this.waterOverlay.ellipse(px, py, 18 + Math.sin(phase + x) * 3, 10)
        this.waterOverlay.stroke({ color: '#d7eef0', alpha: pulse, width: 1.5 })
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
