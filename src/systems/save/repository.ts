import { GardenSaveDataSchema, type GardenSaveData } from '@/schemas/garden'
import { usernameKey } from '@/lib/username'
import { isCloudAuthEnabled } from '@/systems/auth/api'
import { db, SAVE_SLOT_COUNT, type SaveSlotRecord } from '@/systems/save/db'
import { useAuthStore } from '@/stores/authStore'

export type SaveSlotSummary = {
  slot: number
  empty: boolean
  name?: string
  updatedAt?: string
  objectCount?: number
  thumbnailDataUrl?: string
}

function requireUsername(): string {
  const username = useAuthStore.getState().user?.username
  if (!username) {
    throw new Error('로그인이 필요합니다.')
  }
  return username
}

function emptySlots(): SaveSlotSummary[] {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => ({
    slot: index + 1,
    empty: true,
  }))
}

async function listLocal(username: string): Promise<SaveSlotSummary[]> {
  const key = usernameKey(username)
  const records = await db.saveSlots.where('usernameLower').equals(key).toArray()
  const bySlot = new Map(records.map((r) => [r.slot, r]))

  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = index + 1
    const record = bySlot.get(slot)
    if (!record) return { slot, empty: true }
    return {
      slot,
      empty: false,
      name: record.garden.name,
      updatedAt: record.updatedAt,
      objectCount: record.garden.metadata.objectCount,
      thumbnailDataUrl: record.thumbnailDataUrl,
    }
  })
}

async function listCloud(username: string): Promise<SaveSlotSummary[]> {
  const res = await fetch(`/api/saves?username=${encodeURIComponent(username)}`)
  const data = (await res.json()) as { slots?: SaveSlotSummary[]; error?: string }
  if (!res.ok) throw new Error(data.error ?? '세이브 목록을 불러오지 못했습니다.')
  return data.slots ?? emptySlots()
}

export async function listSaveSlots(): Promise<SaveSlotSummary[]> {
  const username = requireUsername()
  if (await isCloudAuthEnabled()) return listCloud(username)
  return listLocal(username)
}

/** Normalize loaded garden data; Zod defaults migrate missing v1 season/weather. */
function parseGardenSave(raw: unknown, slot: number): GardenSaveData {
  const parsed = GardenSaveDataSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Save slot ${slot} contains invalid data and was not loaded.`)
  }
  // Persist path always writes schemaVersion 2 via toSaveData(); keep parsed defaults here.
  return parsed.data
}

async function loadLocal(
  username: string,
  slot: number,
): Promise<GardenSaveData | null> {
  const record = await db.saveSlots.get([usernameKey(username), slot])
  if (!record) return null
  return parseGardenSave(record.garden, slot)
}

async function loadCloud(
  username: string,
  slot: number,
): Promise<GardenSaveData | null> {
  const res = await fetch(
    `/api/saves?username=${encodeURIComponent(username)}&slot=${slot}`,
  )
  const data = (await res.json()) as {
    slot?: SaveSlotRecord | null
    error?: string
  }
  if (!res.ok) throw new Error(data.error ?? '세이브를 불러오지 못했습니다.')
  if (!data.slot) return null
  return parseGardenSave(data.slot.garden, slot)
}

export async function loadSlot(slot: number): Promise<GardenSaveData | null> {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) return null
  const username = requireUsername()
  if (await isCloudAuthEnabled()) return loadCloud(username, slot)
  return loadLocal(username, slot)
}

async function saveLocal(
  username: string,
  slot: number,
  garden: GardenSaveData,
  thumbnailDataUrl?: string,
): Promise<void> {
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
    usernameLower: usernameKey(username),
    slot,
    garden: parsed.data,
    thumbnailDataUrl,
    updatedAt: parsed.data.updatedAt,
  }
  await db.saveSlots.put(record)
}

async function saveCloud(
  username: string,
  slot: number,
  garden: GardenSaveData,
  thumbnailDataUrl?: string,
): Promise<void> {
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

  const res = await fetch(`/api/saves?username=${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slot,
      garden: parsed.data,
      thumbnailDataUrl,
    }),
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? '저장에 실패했습니다.')
}

export async function saveSlot(
  slot: number,
  garden: GardenSaveData,
  thumbnailDataUrl?: string,
): Promise<void> {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) {
    throw new Error('Invalid save slot')
  }
  const username = requireUsername()
  if (await isCloudAuthEnabled()) {
    await saveCloud(username, slot, garden, thumbnailDataUrl)
    return
  }
  await saveLocal(username, slot, garden, thumbnailDataUrl)
}

export async function clearSlot(slot: number): Promise<void> {
  const username = requireUsername()
  if (await isCloudAuthEnabled()) {
    throw new Error('클라우드에서는 슬롯 삭제를 아직 지원하지 않습니다.')
  }
  await db.saveSlots.delete([usernameKey(username), slot])
}

export { SAVE_SLOT_COUNT }
