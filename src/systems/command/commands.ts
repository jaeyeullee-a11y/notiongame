import { createId } from '@/lib/ids'
import type {
  PlacedGardenObject,
  TerrainCell,
  TerrainTypeId,
} from '@/schemas/garden'
import type { GardenCommand } from '@/systems/command/types'

type ObjectMutators = {
  addObject: (object: PlacedGardenObject) => void
  removeObject: (instanceId: string) => void
  updateObject: (
    instanceId: string,
    patch: Partial<PlacedGardenObject>,
  ) => void
  replaceObjects: (objects: PlacedGardenObject[]) => void
  replaceTerrain: (terrain: TerrainCell[]) => void
  getObject: (instanceId: string) => PlacedGardenObject | undefined
  getObjects: () => PlacedGardenObject[]
  getTerrain: () => TerrainCell[]
}

export function createPlaceObjectCommand(
  object: PlacedGardenObject,
  mutators: ObjectMutators,
): GardenCommand {
  return {
    id: createId('cmd'),
    label: 'Place object',
    execute: () => mutators.addObject(object),
    undo: () => mutators.removeObject(object.instanceId),
  }
}

export function createDeleteObjectCommand(
  object: PlacedGardenObject,
  mutators: ObjectMutators,
): GardenCommand {
  return {
    id: createId('cmd'),
    label: 'Delete object',
    execute: () => mutators.removeObject(object.instanceId),
    undo: () => mutators.addObject(object),
  }
}

export function createMoveObjectCommand(
  instanceId: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  mutators: ObjectMutators,
): GardenCommand {
  return {
    id: createId('cmd'),
    label: 'Move object',
    execute: () => mutators.updateObject(instanceId, to),
    undo: () => mutators.updateObject(instanceId, from),
  }
}

export function createTransformObjectCommand(
  instanceId: string,
  from: Partial<PlacedGardenObject>,
  to: Partial<PlacedGardenObject>,
  mutators: ObjectMutators,
  label = 'Transform object',
): GardenCommand {
  return {
    id: createId('cmd'),
    label,
    execute: () => mutators.updateObject(instanceId, to),
    undo: () => mutators.updateObject(instanceId, from),
  }
}

export function createPaintTerrainCommand(
  previousSnapshot: TerrainCell[],
  nextSnapshot: TerrainCell[],
  mutators: ObjectMutators,
  terrainTypeId: TerrainTypeId,
): GardenCommand {
  return {
    id: createId('cmd'),
    label: `Paint ${terrainTypeId}`,
    execute: () => mutators.replaceTerrain(nextSnapshot),
    undo: () => mutators.replaceTerrain(previousSnapshot),
  }
}

export function createClearGardenCommand(
  previousObjects: PlacedGardenObject[],
  previousTerrain: TerrainCell[],
  emptyTerrain: TerrainCell[],
  mutators: ObjectMutators,
): GardenCommand {
  return {
    id: createId('cmd'),
    label: 'Clear garden',
    execute: () => {
      mutators.replaceObjects([])
      mutators.replaceTerrain(emptyTerrain)
    },
    undo: () => {
      mutators.replaceObjects(previousObjects)
      mutators.replaceTerrain(previousTerrain)
    },
  }
}

export type { ObjectMutators }
