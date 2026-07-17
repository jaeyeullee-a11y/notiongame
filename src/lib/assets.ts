import assetsData from '@/data/assets.json'
import {
  GardenAssetDefinitionSchema,
  type AssetCategory,
  type GardenAssetDefinition,
} from '@/schemas/garden'

export const ASSET_CATEGORIES: Array<{ id: AssetCategory; label: string }> = [
  { id: 'ground-cover', label: 'Ground Cover' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'shrubs', label: 'Shrubs' },
  { id: 'trees', label: 'Trees' },
  { id: 'features', label: 'Garden Features' },
  { id: 'structures', label: 'Structures' },
]

export const gardenAssets: GardenAssetDefinition[] = assetsData.assets.map(
  (asset) => GardenAssetDefinitionSchema.parse(asset),
)

export const assetsById = new Map(
  gardenAssets.map((asset) => [asset.id, asset]),
)

export function getAssetsByCategory(
  category: AssetCategory | 'all',
): GardenAssetDefinition[] {
  if (category === 'all') return gardenAssets
  return gardenAssets.filter((asset) => asset.category === category)
}

export function searchAssets(query: string): GardenAssetDefinition[] {
  const q = query.trim().toLowerCase()
  if (!q) return gardenAssets
  return gardenAssets.filter(
    (asset) =>
      asset.displayName.toLowerCase().includes(q) ||
      asset.tags.some((tag) => tag.includes(q)) ||
      asset.category.includes(q),
  )
}
