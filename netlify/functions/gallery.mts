import type { Context } from '@netlify/functions'
import { z } from 'zod'
import {
  accountStore,
  deleteKey,
  readJson,
  writeJson,
} from './_store.mts'

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

type GalleryCounts = {
  likeCount: number
  viewCount: number
}

type UserRecord = {
  username: string
  usernameLower: string
  createdAt: string
}

type ShareRecord = {
  shareId: string
  garden: { name?: string }
  thumbnailDataUrl?: string
  createdAt: string
  ownerUsernameLower: string
  ownerUsername?: string
}

const PublishPayloadSchema = z.object({
  action: z.literal('publish').optional(),
  shareId: z.string().min(6).max(32),
  username: z.string().min(3).max(24),
  gardenName: z.string().min(1).max(80),
  thumbnailDataUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
})

const UnpublishPayloadSchema = z.object({
  action: z.literal('unpublish'),
  shareId: z.string().min(6).max(32),
  username: z.string().min(3).max(24),
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

async function readIndex(): Promise<GalleryEntry[]> {
  const store = accountStore('stillgarden-gallery-index')
  const entries = await readJson<GalleryEntry[]>(store, 'entries')
  return Array.isArray(entries) ? entries : []
}

async function writeIndex(entries: GalleryEntry[]): Promise<void> {
  const store = accountStore('stillgarden-gallery-index')
  await writeJson(store, 'entries', entries)
}

async function readCounts(shareId: string): Promise<GalleryCounts> {
  const store = accountStore('stillgarden-gallery-counts')
  const counts = await readJson<GalleryCounts>(store, shareId)
  return {
    likeCount: counts?.likeCount ?? 0,
    viewCount: counts?.viewCount ?? 0,
  }
}

function sortEntries(
  entries: GalleryEntry[],
  sort: 'likes' | 'views' | 'newest',
): GalleryEntry[] {
  const copy = [...entries]
  if (sort === 'likes') {
    copy.sort(
      (a, b) =>
        b.likeCount - a.likeCount ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
  } else if (sort === 'views') {
    copy.sort(
      (a, b) =>
        b.viewCount - a.viewCount ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
  } else {
    copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }
  return copy
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
      const sortParam = url.searchParams.get('sort') ?? 'likes'
      const sort =
        sortParam === 'views' || sortParam === 'newest' || sortParam === 'likes'
          ? sortParam
          : 'likes'
      const limitRaw = Number(url.searchParams.get('limit') ?? '20')
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.trunc(limitRaw), 1), 50)
        : 20
      const cursorRaw = url.searchParams.get('cursor')
      const offset = cursorRaw ? Number(cursorRaw) : 0
      const start = Number.isFinite(offset) && offset > 0 ? Math.trunc(offset) : 0

      const all = (await readIndex()).filter((entry) => entry.isPublic)
      // Refresh live counters so list stays accurate after likes/views.
      const withCounts = await Promise.all(
        all.map(async (entry) => {
          const counts = await readCounts(entry.shareId)
          return {
            ...entry,
            likeCount: counts.likeCount,
            viewCount: counts.viewCount,
          }
        }),
      )
      const sorted = sortEntries(withCounts, sort)
      const page = sorted.slice(start, start + limit)
      const nextCursor =
        start + limit < sorted.length ? String(start + limit) : undefined

      return json(200, {
        entries: page.map((entry) => ({
          ...entry,
          thumbnailUrl: `/api/gallery-thumb?id=${encodeURIComponent(entry.shareId)}`,
        })),
        totalCount: sorted.length,
        cursor: nextCursor,
      })
    }

    if (req.method === 'POST') {
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
          : 'publish'

      if (action === 'unpublish') {
        const parsed = UnpublishPayloadSchema.safeParse(payload)
        if (!parsed.success) {
          return json(400, { error: '비공개 요청이 올바르지 않습니다.' })
        }
        const username = normalizeUser(parsed.data.username)
        if (!username) {
          return json(400, { error: '유효한 아이디가 필요합니다.' })
        }
        const usernameLower = username.toLowerCase()
        const users = accountStore('stillgarden-users')
        const user = await readJson<UserRecord>(users, usernameLower)
        if (!user) {
          return json(401, { error: '로그인된 계정을 찾을 수 없습니다.' })
        }

        const entries = await readIndex()
        const existing = entries.find(
          (entry) => entry.shareId === parsed.data.shareId,
        )
        if (!existing) {
          return json(404, { error: '갤러리에서 정원을 찾을 수 없습니다.' })
        }
        if (existing.ownerUsername.toLowerCase() !== usernameLower) {
          return json(403, { error: '본인 정원만 비공개로 전환할 수 있습니다.' })
        }

        await writeIndex(
          entries.filter((entry) => entry.shareId !== parsed.data.shareId),
        )
        const thumbs = accountStore('stillgarden-gallery-thumbs')
        await deleteKey(thumbs, parsed.data.shareId)
        return json(200, { ok: true })
      }

      const parsed = PublishPayloadSchema.safeParse({
        ...(typeof payload === 'object' && payload ? payload : {}),
        action: 'publish',
      })
      if (!parsed.success) {
        return json(400, { error: '갤러리 공개 요청이 올바르지 않습니다.' })
      }
      if (!parsed.data.isPublic) {
        // Treat publish with isPublic=false as unpublish-equivalent no-op insert.
        return json(200, {
          ok: true,
          entry: null,
        })
      }

      const username = normalizeUser(parsed.data.username)
      if (!username) {
        return json(400, { error: '유효한 아이디가 필요합니다.' })
      }
      const usernameLower = username.toLowerCase()
      const users = accountStore('stillgarden-users')
      const user = await readJson<UserRecord>(users, usernameLower)
      if (!user) {
        return json(401, { error: '로그인된 계정을 찾을 수 없습니다.' })
      }

      const shares = accountStore('stillgarden-shares')
      const share = await readJson<ShareRecord>(
        shares,
        `share:${parsed.data.shareId}`,
      )
      if (!share) {
        return json(404, { error: '공유 정원을 찾을 수 없습니다.' })
      }
      if (share.ownerUsernameLower !== usernameLower) {
        return json(403, { error: '본인 정원만 갤러리에 공개할 수 있습니다.' })
      }

      const counts = await readCounts(parsed.data.shareId)
      const publishedAt = new Date().toISOString()
      const thumbnailKey = parsed.data.shareId
      const entry: GalleryEntry = {
        shareId: parsed.data.shareId,
        ownerUsername: user.username,
        gardenName: parsed.data.gardenName.trim() || share.garden.name || 'Garden',
        thumbnailKey,
        likeCount: counts.likeCount,
        viewCount: counts.viewCount,
        publishedAt,
        isPublic: true,
      }

      if (parsed.data.thumbnailDataUrl || share.thumbnailDataUrl) {
        const thumbs = accountStore('stillgarden-gallery-thumbs')
        await writeJson(thumbs, thumbnailKey, {
          dataUrl: parsed.data.thumbnailDataUrl ?? share.thumbnailDataUrl,
        })
      }

      const entries = await readIndex()
      const without = entries.filter((item) => item.shareId !== entry.shareId)
      without.push(entry)
      await writeIndex(without)

      const countsStore = accountStore('stillgarden-gallery-counts')
      await writeJson(countsStore, entry.shareId, counts)

      return json(200, {
        ok: true,
        entry: {
          ...entry,
          thumbnailUrl: `/api/gallery-thumb?id=${encodeURIComponent(entry.shareId)}`,
        },
      })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '갤러리 저장소 오류가 발생했습니다.'
    return json(500, { error: message })
  }
}
