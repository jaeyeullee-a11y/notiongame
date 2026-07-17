import { create } from 'zustand'
import { defaultCamera } from '@/lib/camera'
import { createEmptyTerrain } from '@/lib/terrainBrush'
import { createId } from '@/lib/ids'
import type {
  CameraState,
  GardenSaveData,
  GardenSettings,
  PlacedGardenObject,
  Season,
  TerrainCell,
  WeatherType,
} from '@/schemas/garden'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'

type GardenState = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  terrain: TerrainCell[]
  objects: PlacedGardenObject[]
  camera: CameraState
  settings: GardenSettings
  season: Season
  weather: WeatherType
  playTimeSeconds: number
  generatorSeed?: number
  dirty: boolean
  activeSlot: number | null

  hydrateFromSave: (save: GardenSaveData, slot?: number | null) => void
  newGarden: (mode: 'empty' | 'surprise', name?: string) => void
  setName: (name: string) => void
  setCamera: (camera: CameraState) => void
  setSettings: (settings: Partial<GardenSettings>) => void
  setSeason: (season: Season) => void
  setWeather: (weather: WeatherType) => void
  addObject: (object: PlacedGardenObject) => void
  removeObject: (instanceId: string) => void
  updateObject: (instanceId: string, patch: Partial<PlacedGardenObject>) => void
  replaceObjects: (objects: PlacedGardenObject[]) => void
  replaceTerrain: (terrain: TerrainCell[]) => void
  getObject: (instanceId: string) => PlacedGardenObject | undefined
  markClean: () => void
  markDirty: () => void
  toSaveData: () => GardenSaveData
  tickPlayTime: (deltaSeconds: number) => void
}

const initial = createNewGardenSave('Untitled Garden', 'empty')

export const useGardenStore = create<GardenState>((set, get) => ({
  id: initial.id,
  name: initial.name,
  createdAt: initial.createdAt,
  updatedAt: initial.updatedAt,
  terrain: initial.terrain,
  objects: initial.objects,
  camera: initial.camera,
  settings: initial.settings,
  season: initial.season,
  weather: initial.weather,
  playTimeSeconds: 0,
  generatorSeed: undefined,
  dirty: false,
  activeSlot: 1,

  hydrateFromSave: (save, slot = null) => {
    set({
      id: save.id,
      name: save.name,
      createdAt: save.createdAt,
      updatedAt: save.updatedAt,
      terrain: save.terrain.map((c) => ({ ...c })),
      objects: save.objects.map((o) => ({ ...o })),
      camera: { ...save.camera },
      settings: { ...save.settings },
      season: save.season,
      weather: save.weather,
      playTimeSeconds: save.metadata.playTimeSeconds,
      generatorSeed: save.metadata.generatorSeed,
      dirty: false,
      activeSlot: slot,
    })
  },

  newGarden: (mode, name = 'Untitled Garden') => {
    const save = createNewGardenSave(name, mode)
    get().hydrateFromSave(save, get().activeSlot)
    set({ dirty: true })
  },

  setName: (name) => set({ name, dirty: true }),

  setCamera: (camera) => set({ camera }),

  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
      dirty: true,
    })),

  setSeason: (season) => set({ season, dirty: true }),

  setWeather: (weather) => set({ weather, dirty: true }),

  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
      dirty: true,
    })),

  removeObject: (instanceId) =>
    set((state) => ({
      objects: state.objects.filter((o) => o.instanceId !== instanceId),
      dirty: true,
    })),

  updateObject: (instanceId, patch) =>
    set((state) => ({
      objects: state.objects.map((o) =>
        o.instanceId === instanceId ? { ...o, ...patch } : o,
      ),
      dirty: true,
    })),

  replaceObjects: (objects) => set({ objects: objects.map((o) => ({ ...o })), dirty: true }),

  replaceTerrain: (terrain) =>
    set({ terrain: terrain.map((c) => ({ ...c })), dirty: true }),

  getObject: (instanceId) => get().objects.find((o) => o.instanceId === instanceId),

  markClean: () => set({ dirty: false, updatedAt: new Date().toISOString() }),

  markDirty: () => set({ dirty: true }),

  toSaveData: () => {
    const state = get()
    return {
      schemaVersion: 2 as const,
      id: state.id || createId('garden'),
      name: state.name,
      createdAt: state.createdAt,
      updatedAt: new Date().toISOString(),
      world: { width: 2400 as const, height: 1600 as const },
      camera: state.camera,
      terrain: state.terrain,
      objects: state.objects,
      settings: state.settings,
      season: state.season,
      weather: state.weather,
      metadata: {
        objectCount: state.objects.length,
        playTimeSeconds: state.playTimeSeconds,
        generatorSeed: state.generatorSeed,
      },
    }
  },

  tickPlayTime: (deltaSeconds) => {
    // Mutate without notifying subscribers — playtime is metadata only.
    const state = get()
    state.playTimeSeconds += deltaSeconds
  },
}))

export function resetGardenToEmpty(): void {
  useGardenStore.setState({
    terrain: createEmptyTerrain('grass'),
    objects: [],
    camera: defaultCamera(),
    dirty: true,
  })
}
