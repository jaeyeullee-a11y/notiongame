import Dexie, { type Table } from 'dexie'
import type { GardenSaveData } from '@/schemas/garden'

export type SaveSlotRecord = {
  slot: number
  garden: GardenSaveData
  thumbnailDataUrl?: string
}

class StillgardenDB extends Dexie {
  saveSlots!: Table<SaveSlotRecord, number>

  constructor() {
    super('stillgarden')
    this.version(1).stores({
      saveSlots: 'slot, garden.updatedAt',
    })
  }
}

export const db = new StillgardenDB()

export const SAVE_SLOT_COUNT = 6
