import type { PlacedGardenObject } from '@/schemas/garden'

export function getSortKey(object: PlacedGardenObject): number {
  return object.y + object.sortOffset
}

export function sortObjectsByDepth(
  objects: PlacedGardenObject[],
): PlacedGardenObject[] {
  return [...objects].sort((a, b) => {
    const keyDiff = getSortKey(a) - getSortKey(b)
    if (keyDiff !== 0) return keyDiff
    return a.instanceId.localeCompare(b.instanceId)
  })
}
