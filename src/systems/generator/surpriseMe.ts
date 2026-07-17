import theme from '@/data/theme.json'
import { assetsById, gardenAssets } from '@/lib/assets'
import { createId } from '@/lib/ids'
import {
  applyTerrainPaint,
  createEmptyTerrain,
  worldToCell,
} from '@/lib/terrainBrush'
import type {
  GardenSaveData,
  PlacedGardenObject,
  TerrainCell,
} from '@/schemas/garden'
import { defaultCamera } from '@/lib/camera'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function placeObject(
  assetId: string,
  x: number,
  y: number,
  rand: () => number,
): PlacedGardenObject {
  const asset = assetsById.get(assetId)
  const scaleSteps = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15]
  return {
    instanceId: createId('obj'),
    assetId,
    x,
    y,
    rotation: asset?.canRotate ? Math.floor(rand() * 8) * 15 : 0,
    scale: scaleSteps[Math.floor(rand() * scaleSteps.length)] ?? 1,
    flipX: Boolean(asset?.canFlip && rand() > 0.7),
    sortOffset: asset?.sortOffset ?? 0,
  }
}

function paintDisk(
  terrain: TerrainCell[],
  cx: number,
  cy: number,
  radius: number,
  type: TerrainCell['terrainTypeId'],
): TerrainCell[] {
  const cells: Array<{ x: number; y: number }> = []
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) cells.push({ x, y })
    }
  }
  return applyTerrainPaint(terrain, cells, type).next
}

function estimateOpenSpace(objects: PlacedGardenObject[]): number {
  const worldArea = theme.world.width * theme.world.height
  let occupied = 0
  for (const object of objects) {
    const asset = assetsById.get(object.assetId)
    if (!asset) continue
    occupied +=
      Math.PI *
      ((asset.footprintWidth * object.scale) / 2) *
      ((asset.footprintHeight * object.scale) / 2)
  }
  return 1 - occupied / worldArea
}

export function generateSurpriseGarden(seed = Date.now()): {
  terrain: TerrainCell[]
  objects: PlacedGardenObject[]
  seed: number
} {
  const rand = mulberry32(seed)
  let best: {
    terrain: TerrainCell[]
    objects: PlacedGardenObject[]
  } | null = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    let terrain = createEmptyTerrain('grass')
    const objects: PlacedGardenObject[] = []

    // Curved stone path across roughly one-third of the map
    const pathY = 8 + Math.floor(rand() * 8)
    for (let x = 2; x < theme.world.cols - 2; x += 1) {
      const wave = Math.round(Math.sin(x / 4) * 2)
      terrain = paintDisk(terrain, x, pathY + wave, 1, 'stone')
    }

    // Optional pond in a corner
    if (rand() > 0.25) {
      const pondX = rand() > 0.5 ? 6 + Math.floor(rand() * 4) : theme.world.cols - 10
      const pondY = rand() > 0.5 ? 5 + Math.floor(rand() * 4) : theme.world.rows - 9
      terrain = paintDisk(terrain, pondX, pondY, 3 + Math.floor(rand() * 2), 'water')
      terrain = paintDisk(terrain, pondX + 1, pondY + 1, 2, 'soil')
    }

    // Soil beds near path
    terrain = paintDisk(terrain, 12, pathY - 3, 2, 'soil')
    terrain = paintDisk(terrain, 26, pathY + 3, 2, 'soil')

    const heroes = ['willow-tree', 'small-gazebo', 'garden-arch'] as const
    const hero = heroes[Math.floor(rand() * heroes.length)] ?? 'willow-tree'
    objects.push(
      placeObject(
        hero,
        400 + rand() * 1600,
        400 + rand() * 800,
        rand,
      ),
    )

    const plantPool = gardenAssets
      .filter((a) =>
        ['flowers', 'shrubs', 'trees'].includes(a.category),
      )
      .map((a) => a.id)

    for (let cluster = 0; cluster < 2; cluster += 1) {
      const cx = 300 + rand() * 1800
      const cy = 300 + rand() * 1000
      const count = 3 + Math.floor(rand() * 4)
      for (let i = 0; i < count; i += 1) {
        const id = plantPool[Math.floor(rand() * plantPool.length)]
        if (!id) continue
        objects.push(
          placeObject(id, cx + (rand() - 0.5) * 220, cy + (rand() - 0.5) * 160, rand),
        )
      }
    }

    const groundCover = gardenAssets
      .filter((a) => a.category === 'ground-cover')
      .map((a) => a.id)
    const coverCount = 4 + Math.floor(rand() * 5)
    for (let i = 0; i < coverCount; i += 1) {
      const id = groundCover[Math.floor(rand() * groundCover.length)]
      if (!id) continue
      objects.push(
        placeObject(id, 200 + rand() * 2000, 200 + rand() * 1200, rand),
      )
    }

    // Occasional features
    if (rand() > 0.4) {
      objects.push(
        placeObject('wooden-bench', 500 + rand() * 1400, 500 + rand() * 700, rand),
      )
    }
    if (rand() > 0.5) {
      objects.push(
        placeObject('bird-bath', 600 + rand() * 1200, 500 + rand() * 700, rand),
      )
    }

    // Keep objects in world bounds
    for (const object of objects) {
      object.x = Math.min(theme.world.width - 40, Math.max(40, object.x))
      object.y = Math.min(theme.world.height - 40, Math.max(80, object.y))
    }

    if (estimateOpenSpace(objects) >= 0.4) {
      best = { terrain, objects }
      break
    }
    best = { terrain, objects }
  }

  return {
    terrain: best?.terrain ?? createEmptyTerrain('grass'),
    objects: best?.objects ?? [],
    seed,
  }
}

export function createNewGardenSave(
  name: string,
  mode: 'empty' | 'surprise' = 'empty',
  seed?: number,
): GardenSaveData {
  const now = new Date().toISOString()
  const generated =
    mode === 'surprise'
      ? generateSurpriseGarden(seed)
      : { terrain: createEmptyTerrain('grass'), objects: [], seed: undefined }

  return {
    schemaVersion: 2,
    id: createId('garden'),
    name,
    createdAt: now,
    updatedAt: now,
    world: { width: 2400, height: 1600 },
    camera: defaultCamera(),
    terrain: generated.terrain,
    objects: generated.objects,
    settings: {
      musicEnabled: true,
      ambienceEnabled: true,
      musicVolume: 0.45,
      ambienceVolume: 0.35,
    },
    season: 'spring',
    weather: 'clear',
    metadata: {
      objectCount: generated.objects.length,
      playTimeSeconds: 0,
      generatorSeed: generated.seed,
    },
  }
}

export function cellAtWorld(
  terrain: TerrainCell[],
  worldX: number,
  worldY: number,
): TerrainCell | null {
  const cell = worldToCell(worldX, worldY)
  if (!cell) return null
  return terrain.find((t) => t.x === cell.x && t.y === cell.y) ?? null
}
