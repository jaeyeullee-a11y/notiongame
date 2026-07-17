import { z } from 'zod'

export const AssetCategorySchema = z.enum([
  'ground-cover',
  'flowers',
  'shrubs',
  'trees',
  'features',
  'structures',
])

export const GardenAssetDefinitionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  category: AssetCategorySchema,
  spriteUrl: z.string(),
  thumbnailUrl: z.string(),
  nativeWidth: z.number().positive(),
  nativeHeight: z.number().positive(),
  anchorX: z.number().default(0.5),
  anchorY: z.number().default(1),
  footprintWidth: z.number().positive(),
  footprintHeight: z.number().positive(),
  defaultScale: z.number().positive(),
  minScale: z.number().positive().default(0.75),
  maxScale: z.number().positive().default(1.25),
  canRotate: z.boolean(),
  canFlip: z.boolean(),
  sortOffset: z.number().default(0),
  tags: z.array(z.string()),
})

export const PlacedGardenObjectSchema = z.object({
  instanceId: z.string(),
  assetId: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  scale: z.number(),
  flipX: z.boolean(),
  sortOffset: z.number(),
})

export const TerrainTypeIdSchema = z.enum(['grass', 'soil', 'stone', 'water'])
export const SeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter'])
export const WeatherTypeSchema = z.enum(['clear', 'rain', 'snow'])

export const TerrainCellSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  terrainTypeId: TerrainTypeIdSchema,
  variation: z.number().int().nonnegative(),
})

export const GardenSaveDataSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  world: z.object({
    width: z.literal(2400),
    height: z.literal(1600),
  }),
  camera: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }),
  terrain: z.array(TerrainCellSchema),
  objects: z.array(PlacedGardenObjectSchema),
  season: SeasonSchema.default('spring'),
  weather: WeatherTypeSchema.default('clear'),
  settings: z.object({
    musicEnabled: z.boolean(),
    ambienceEnabled: z.boolean(),
    musicVolume: z.number().min(0).max(1),
    ambienceVolume: z.number().min(0).max(1),
  }),
  metadata: z.object({
    objectCount: z.number().int().nonnegative(),
    playTimeSeconds: z.number().nonnegative(),
    generatorSeed: z.number().optional(),
  }),
})

export type AssetCategory = z.infer<typeof AssetCategorySchema>
export type GardenAssetDefinition = z.infer<typeof GardenAssetDefinitionSchema>
export type PlacedGardenObject = z.infer<typeof PlacedGardenObjectSchema>
export type TerrainTypeId = z.infer<typeof TerrainTypeIdSchema>
export type Season = z.infer<typeof SeasonSchema>
export type WeatherType = z.infer<typeof WeatherTypeSchema>
export type TerrainCell = z.infer<typeof TerrainCellSchema>
export type GardenSaveData = z.infer<typeof GardenSaveDataSchema>

export type EditorTool =
  | 'select'
  | 'terrain'
  | 'place'
  | 'erase'
  | 'pan'
  | 'observe'

export type BrushShape = 'round' | 'path'
export type BrushSize = 1 | 2 | 4

export type CameraState = {
  x: number
  y: number
  zoom: number
}

export type GardenSettings = GardenSaveData['settings']
