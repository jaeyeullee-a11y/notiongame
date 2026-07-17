import type { GardenAssetDefinition, PlacedGardenObject } from '@/schemas/garden'
import { getSortKey } from '@/lib/depth'

export function pointInEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean {
  if (rx <= 0 || ry <= 0) return false
  const dx = (px - cx) / rx
  const dy = (py - cy) / ry
  return dx * dx + dy * dy <= 1
}

export function hitTestObjects(
  worldX: number,
  worldY: number,
  objects: PlacedGardenObject[],
  assetsById: Map<string, GardenAssetDefinition>,
  preferAboveId?: string | null,
): PlacedGardenObject | null {
  const sorted = [...objects].sort((a, b) => getSortKey(b) - getSortKey(a))
  const hits = sorted.filter((object) => {
    const asset = assetsById.get(object.assetId)
    if (!asset) return false
    const rx = (asset.footprintWidth * object.scale) / 2
    const ry = (asset.footprintHeight * object.scale) / 2
    return pointInEllipse(worldX, worldY, object.x, object.y, rx, ry)
  })

  if (hits.length === 0) return null
  if (!preferAboveId) return hits[0] ?? null

  const currentIndex = hits.findIndex((h) => h.instanceId === preferAboveId)
  if (currentIndex === -1) return hits[0] ?? null
  return hits[(currentIndex + 1) % hits.length] ?? null
}
