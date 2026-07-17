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
    // New DB name avoids unsupported primary-key migrations from the MVP schema.
    super('stillgarden-accounts')
    this.version(1).stores({
      users: 'usernameLower, username',
      saveSlots: '[usernameLower+slot], usernameLower, updatedAt',
    })
  }
}

export const db = new StillgardenDB()

export const SAVE_SLOT_COUNT = 6

/** Best-effort cleanup of the pre-account IndexedDB database. */
export async function purgeLegacyDatabase(): Promise<void> {
  try {
    await Dexie.delete('stillgarden')
  } catch {
    // Ignore — legacy DB may already be gone.
  }
}
