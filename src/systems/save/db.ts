import Dexie, { type Table } from 'dexie'
import type { GardenSaveData } from '@/schemas/garden'

export type UserRecord = {
  usernameLower: string
  username: string
  createdAt: string
}

export type SaveSlotRecord = {
  usernameLower: string
  slot: number
  garden: GardenSaveData
  thumbnailDataUrl?: string
  updatedAt: string
}

class StillgardenDB extends Dexie {
  users!: Table<UserRecord, string>
  saveSlots!: Table<SaveSlotRecord, [string, number]>

  constructor() {
    super('stillgarden')
    this.version(1).stores({
      saveSlots: 'slot, garden.updatedAt',
    })
    this.version(2)
      .stores({
        users: 'usernameLower, username',
        saveSlots: '[usernameLower+slot], usernameLower, updatedAt',
      })
      .upgrade(async (tx) => {
        // Drop legacy unscoped slots; accounts own saves going forward.
        await tx.table('saveSlots').clear()
      })
  }
}

export const db = new StillgardenDB()

export const SAVE_SLOT_COUNT = 6
