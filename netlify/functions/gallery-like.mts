import type { Context } from '@netlify/functions'
import { z } from 'zod'
import {
  accountStore,
  deleteKey,
  readJson,
  writeJson,
} from './_store.mts'

type GalleryCounts = {
  likeCount: number
  viewCount: number
}

type GalleryEntry = {
  shareId: string
  ownerUsername: string
  gardenName: string
  thumbnailKey: string
  likeCount: number
  viewCount: number
  publishedAt: string
  isPublic: boolean
}

type LikeRecord = {
  shareId: string
  usernameLower: string
  likedAt: string
}

type UserRecord = {
  username: string
  usernameLower: string
  createdAt: string
}

const LikePayloadSchema = z.object({
  action: z.literal('like').default('like'),
  shareId: z.string().min(6).max(32),
  username: z.string().min(3).max(24),
})

const ViewPayloadSchema = z.object({
  action: z.literal('view'),
  shareId: z.string().min(6).max(32),
})

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

function likeKey(shareId: string, usernameLower: string): string {
  return `${shareId}:${usernameLower}`
}

async function readCounts(shareId: string): Promise<GalleryCounts> {
  const store = accountStore('stillgarden-gallery-counts')
  const counts = await readJson<GalleryCounts>(store, shareId)
  return {
    likeCount: counts?.likeCount ?? 0,
    viewCount: counts?.viewCount ?? 0,
  }
}

async function writeCounts(shareId: string, counts: GalleryCounts): Promise<void> {
  const store = accountStore('stillgarden-gallery-counts')
  await writeJson(store, shareId, counts)
}

async function syncIndexCounts(shareId: string, counts: GalleryCounts): Promise<void> {
  const indexStore = accountStore('stillgarden-gallery-index')
  const entries = (await readJson<GalleryEntry[]>(indexStore, 'entries')) ?? []
  if (!Array.isArray(entries) || entries.length === 0) return
  let changed = false
  const next = entries.map((entry) => {
    if (entry.shareId !== shareId) return entry
    changed = true
    return {
      ...entry,
      likeCount: counts.likeCount,
      viewCount: counts.viewCount,
    }
  })
  if (changed) {
    await writeJson(indexStore, 'entries', next)
  }
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
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const username = normalizeUser(url.searchParams.get('username'))
      if (!username) {
        return json(400, { error: '유효한 아이디가 필요합니다.' })
      }
      const usernameLower = username.toLowerCase()
      const users = accountStore('stillgarden-users')
      const user = await readJson<UserRecord>(users, usernameLower)
      if (!user) {
        return json(401, { error: '로그인된 계정을 찾을 수 없습니다.' })
      }

      const indexStore = accountStore('stillgarden-gallery-index')
      const entries = (await readJson<GalleryEntry[]>(indexStore, 'entries')) ?? []
      const likesStore = accountStore('stillgarden-gallery-likes')
      const likedIds: string[] = []
      for (const entry of Array.isArray(entries) ? entries : []) {
        const record = await readJson<LikeRecord>(
          likesStore,
          likeKey(entry.shareId, usernameLower),
        )
        if (record) likedIds.push(entry.shareId)
      }
      return json(200, { likedIds })
    }

    if (req.method !== 'POST') {
      return json(405, { error: 'Method not allowed' })
    }

    let payload: unknown
    try {
      payload = await req.json()
    } catch {
      return json(400, { error: '잘못된 요청입니다.' })
    }

    const action =
      typeof payload === 'object' &&
      payload &&
      'action' in payload &&
      typeof (payload as { action?: unknown }).action === 'string'
        ? (payload as { action: string }).action
        : 'like'

    if (action === 'view') {
      const parsed = ViewPayloadSchema.safeParse(payload)
      if (!parsed.success) {
        return json(400, { error: '조회수 요청이 올바르지 않습니다.' })
      }
      const counts = await readCounts(parsed.data.shareId)
      const next = {
        likeCount: counts.likeCount,
        viewCount: counts.viewCount + 1,
      }
      await writeCounts(parsed.data.shareId, next)
      await syncIndexCounts(parsed.data.shareId, next)
      return json(200, { viewCount: next.viewCount })
    }

    const parsed = LikePayloadSchema.safeParse({
      ...(typeof payload === 'object' && payload ? payload : {}),
      action: 'like',
    })
    if (!parsed.success) {
      return json(400, { error: '좋아요 요청이 올바르지 않습니다.' })
    }

    const username = normalizeUser(parsed.data.username)
    if (!username) {
      return json(400, { error: '유효한 아이디가 필요합니다.' })
    }
    const usernameLower = username.toLowerCase()
    const users = accountStore('stillgarden-users')
    const user = await readJson<UserRecord>(users, usernameLower)
    if (!user) {
      return json(401, { error: '로그인이 필요합니다.' })
    }

    const indexStore = accountStore('stillgarden-gallery-index')
    const entries = (await readJson<GalleryEntry[]>(indexStore, 'entries')) ?? []
    const listed = Array.isArray(entries)
      ? entries.find((entry) => entry.shareId === parsed.data.shareId && entry.isPublic)
      : undefined
    if (!listed) {
      return json(404, { error: '갤러리에서 정원을 찾을 수 없습니다.' })
    }

    const likesStore = accountStore('stillgarden-gallery-likes')
    const key = likeKey(parsed.data.shareId, usernameLower)
    const existing = await readJson<LikeRecord>(likesStore, key)
    const counts = await readCounts(parsed.data.shareId)

    if (existing) {
      await deleteKey(likesStore, key)
      const next = {
        likeCount: Math.max(0, counts.likeCount - 1),
        viewCount: counts.viewCount,
      }
      await writeCounts(parsed.data.shareId, next)
      await syncIndexCounts(parsed.data.shareId, next)
      return json(200, { liked: false, likeCount: next.likeCount })
    }

    const record: LikeRecord = {
      shareId: parsed.data.shareId,
      usernameLower,
      likedAt: new Date().toISOString(),
    }
    await writeJson(likesStore, key, record)
    const next = {
      likeCount: counts.likeCount + 1,
      viewCount: counts.viewCount,
    }
    await writeCounts(parsed.data.shareId, next)
    await syncIndexCounts(parsed.data.shareId, next)
    return json(200, { liked: true, likeCount: next.likeCount })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.'
    return json(500, { error: message })
  }
}
