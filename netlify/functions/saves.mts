import type { Context } from '@netlify/functions'
import { accountStore, readJson, writeJson } from './_store.mts'

const SAVE_SLOT_COUNT = 6

type SaveSlotRecord = {
  slot: number
  garden: unknown
  thumbnailDataUrl?: string
  updatedAt: string
}

type UserRecord = {
  username: string
  usernameLower: string
  createdAt: string
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function normalizeUser(raw: string | null): string | null {
  if (!raw) return null
  const username = raw.trim()
  if (username.length < 3 || username.length > 24) return null
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) return null
  return username
}

async function assertUserExists(usernameLower: string): Promise<boolean> {
  const users = accountStore('stillgarden-users')
  const existing = await readJson<UserRecord>(users, usernameLower)
  return Boolean(existing)
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const url = new URL(req.url)
  const username = normalizeUser(url.searchParams.get('username'))
  if (!username) {
    return json(400, { error: '유효한 아이디가 필요합니다.' })
  }
  const usernameLower = username.toLowerCase()

  try {
    if (!(await assertUserExists(usernameLower))) {
      return json(401, { error: '로그인된 계정을 찾을 수 없습니다.' })
    }

    const saves = accountStore('stillgarden-saves')

    if (req.method === 'GET') {
      const slotParam = url.searchParams.get('slot')
      if (slotParam) {
        const slot = Number(slotParam)
        if (!Number.isInteger(slot) || slot < 1 || slot > SAVE_SLOT_COUNT) {
          return json(400, { error: '잘못된 슬롯입니다.' })
        }
        const record = await readJson<SaveSlotRecord>(
          saves,
          `${usernameLower}:${slot}`,
        )
        return json(200, { slot: record })
      }

      const slots = await Promise.all(
        Array.from({ length: SAVE_SLOT_COUNT }, async (_, index) => {
          const slot = index + 1
          const record = await readJson<SaveSlotRecord>(
            saves,
            `${usernameLower}:${slot}`,
          )
          if (!record) return { slot, empty: true }
          const garden = record.garden as {
            name?: string
            updatedAt?: string
            metadata?: { objectCount?: number }
          }
          return {
            slot,
            empty: false,
            name: garden.name,
            updatedAt: record.updatedAt ?? garden.updatedAt,
            objectCount: garden.metadata?.objectCount,
            thumbnailDataUrl: record.thumbnailDataUrl,
          }
        }),
      )
      return json(200, { slots })
    }

    if (req.method === 'PUT') {
      let payload: {
        slot?: number
        garden?: unknown
        thumbnailDataUrl?: string
      }
      try {
        payload = (await req.json()) as typeof payload
      } catch {
        return json(400, { error: '잘못된 요청입니다.' })
      }

      const slot = Number(payload.slot)
      if (!Number.isInteger(slot) || slot < 1 || slot > SAVE_SLOT_COUNT) {
        return json(400, { error: '잘못된 슬롯입니다.' })
      }
      if (!payload.garden || typeof payload.garden !== 'object') {
        return json(400, { error: '정원 데이터가 필요합니다.' })
      }

      const updatedAt = new Date().toISOString()
      const record: SaveSlotRecord = {
        slot,
        garden: payload.garden,
        thumbnailDataUrl: payload.thumbnailDataUrl,
        updatedAt,
      }
      await writeJson(saves, `${usernameLower}:${slot}`, record)
      return json(200, { ok: true, updatedAt })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '세이브 저장소 오류가 발생했습니다.'
    return json(500, { error: message })
  }
}
