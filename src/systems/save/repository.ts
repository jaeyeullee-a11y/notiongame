import { GardenSaveDataSchema, type GardenSaveData } from '@/schemas/garden'
import { db, SAVE_SLOT_COUNT, type SaveSlotRecord } from '@/systems/save/db'

export type SaveSlotSummary = {
  slot: number
  empty: boolean
  name?: string
  updatedAt?: string
  objectCount?: number
  thumbnailDataUrl?: string
}

export async function listSaveSlots(): Promise<SaveSlotSummary[]> {
  const records = await db.saveSlots.toArray()
  const bySlot = new Map(records.map((r) => [r.slot, r]))

  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = index + 1
    const record = bySlot.get(slot)
    if (!record) {
      return { slot, empty: true }
    }
    return {
      slot,
      empty: false,
      name: record.garden.name,
      updatedAt: record.garden.updatedAt,
      objectCount: record.garden.metadata.objectCount,
      thumbnailDataUrl: record.thumbnailDataUrl,
    }
  })
}

export async function loadSlot(slot: number): Promise<GardenSaveData | null> {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) return null
  const record = await db.saveSlots.get(slot)
  if (!record) return null

  const parsed = GardenSaveDataSchema.safeParse(record.garden)
  if (!parsed.success) {
    throw new Error(
      `Save slot ${slot} contains invalid data and was not loaded.`,
    )
  }
  return parsed.data
}

export async function saveSlot(
  slot: number,
  garden: GardenSaveData,
  thumbnailDataUrl?: string,
): Promise<void> {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) {
    throw new Error('Invalid save slot')
  }

  const parsed = GardenSaveDataSchema.safeParse({
    ...garden,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...garden.metadata,
      objectCount: garden.objects.length,
    },
  })

  if (!parsed.success) {
    throw new Error('Garden data failed validation and was not saved.')
  }

  const record: SaveSlotRecord = {
    slot,
    garden: parsed.data,
    thumbnailDataUrl,
  }

  await db.saveSlots.put(record)
}

export async function clearSlot(slot: number): Promise<void> {
  await db.saveSlots.delete(slot)
}
