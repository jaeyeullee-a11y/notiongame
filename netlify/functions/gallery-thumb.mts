import type { Context } from '@netlify/functions'
import { accountStore, readJson } from './_store.mts'

type ThumbRecord = {
  dataUrl?: string
}

function parseDataUrl(dataUrl: string): { contentType: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl)
  if (!match) return null
  const contentType = match[1] || 'application/octet-stream'
  try {
    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return { contentType, bytes }
  } catch {
    return null
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const shareId = url.searchParams.get('id')?.trim()
  if (!shareId || shareId.length < 6 || shareId.length > 32) {
    return new Response(JSON.stringify({ error: '유효한 공유 ID가 필요합니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const thumbs = accountStore('stillgarden-gallery-thumbs')
    const record = await readJson<ThumbRecord>(thumbs, shareId)
    if (!record?.dataUrl) {
      return new Response(null, { status: 404 })
    }

    const parsed = parseDataUrl(record.dataUrl)
    if (!parsed) {
      return new Response(null, { status: 404 })
    }

    return new Response(parsed.bytes, {
      status: 200,
      headers: {
        'Content-Type': parsed.contentType,
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '썸네일을 불러오지 못했습니다.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
