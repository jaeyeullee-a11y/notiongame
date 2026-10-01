import type { Context } from '@netlify/functions'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { accountStore, readJson, writeJson } from './_store.mts'

const GardenSaveDataSchema = z.object({
  schemaVersion: z.literal(1),
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
  terrain: z.array(z.unknown()),
  objects: z.array(z.unknown()),
  settings: z.object({
    musicEnabled: z.boolean(),
    ambienceEnabled: z.boolean(),
    musicVolume: z.number(),
    ambienceVolume: z.number(),
  }),
  metadata: z.object({
    objectCount: z.number().int().nonnegative(),
    playTimeSeconds: z.number().nonnegative(),
    generatorSeed: z.number().optional(),
  }),
})

const ShareCreatePayloadSchema = z.object({
  username: z.string().min(3).max(24),
  garden: GardenSaveDataSchema,
  thumbnailDataUrl: z.string().optional(),
})

const ShareRecordSchema = z.object({
  shareId: z.string(),
  garden: GardenSaveDataSchema,
  thumbnailDataUrl: z.string().optional(),
  createdAt: z.string(),
  ownerUsernameLower: z.string(),
})

type ShareRecord = z.infer<typeof ShareRecordSchema>

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

function normalizeUser(raw: string | null | undefined): string | null {
  if (!raw) return null
  const username = raw.trim()
  if (username.length < 3 || username.length > 24) return null
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) return null
  return username
}

function publicOrigin(req: Request): string {
  const url = new URL(req.url)
  const proto = req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host
  return `${proto}://${host}`
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    if (req.method === 'POST') {
      let payload: unknown
      try {
        payload = await req.json()
      } catch {
        return json(400, { error: '잘못된 요청입니다.' })
      }

      const parsed = ShareCreatePayloadSchema.safeParse(payload)
      if (!parsed.success) {
        return json(400, { error: '공유할 정원 데이터가 올바르지 않습니다.' })
      }

      const username = normalizeUser(parsed.data.username)
      if (!username) {
        return json(400, { error: '유효한 아이디가 필요합니다.' })
      }
      const usernameLower = username.toLowerCase()

      if (!(await assertUserExists(usernameLower))) {
        return json(401, { error: '로그인된 계정을 찾을 수 없습니다.' })
      }

      const shareId = nanoid(10)
      const createdAt = new Date().toISOString()
      const record: ShareRecord = {
        shareId,
        garden: parsed.data.garden,
        thumbnailDataUrl: parsed.data.thumbnailDataUrl,
        createdAt,
        ownerUsernameLower: usernameLower,
      }

      const shares = accountStore('stillgarden-shares')
      await writeJson(shares, `share:${shareId}`, record)

      const shareUrl = `${publicOrigin(req)}/garden/${shareId}`
      return json(200, { shareId, shareUrl })
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const shareId = url.searchParams.get('id')?.trim()
      if (!shareId || shareId.length < 6 || shareId.length > 32) {
        return json(400, { error: '유효한 공유 ID가 필요합니다.' })
      }

      const shares = accountStore('stillgarden-shares')
      const record = await readJson<ShareRecord>(shares, `share:${shareId}`)
      if (!record) {
        return json(404, { error: '정원을 찾을 수 없습니다.' })
      }

      const parsed = ShareRecordSchema.safeParse(record)
      if (!parsed.success) {
        return json(500, { error: '공유 정원 데이터가 손상되었습니다.' })
      }

      return json(200, {
        garden: parsed.data.garden,
        thumbnailDataUrl: parsed.data.thumbnailDataUrl,
        createdAt: parsed.data.createdAt,
      })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '공유 저장소 오류가 발생했습니다.'
    return json(500, { error: message })
  }
}
