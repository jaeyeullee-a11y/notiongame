import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

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

function validateUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return '아이디를 입력해 주세요.'
  const username = raw.trim()
  if (username.length < 3) return '아이디는 최소 3글자여야 합니다.'
  if (username.length > 24) return '아이디는 최대 24글자입니다.'
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) {
    return '아이디는 글자·숫자·_·- 만 사용할 수 있습니다.'
  }
  return null
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let payload: { action?: string; username?: string }
  try {
    payload = (await req.json()) as { action?: string; username?: string }
  } catch {
    return json(400, { error: '잘못된 요청입니다.' })
  }

  const validationError = validateUsername(payload.username)
  if (validationError) return json(400, { error: validationError })

  const username = payload.username!.trim()
  const usernameLower = username.toLowerCase()
  const users = getStore('stillgarden-users')

  if (payload.action === 'signup') {
    const existing = await users.get(usernameLower, { type: 'json' })
    if (existing) {
      return json(409, { error: '이미 사용 중인 아이디입니다.' })
    }
    const record: UserRecord = {
      username,
      usernameLower,
      createdAt: new Date().toISOString(),
    }
    await users.setJSON(usernameLower, record)
    return json(201, { user: { username: record.username, createdAt: record.createdAt } })
  }

  if (payload.action === 'login') {
    const existing = (await users.get(usernameLower, { type: 'json' })) as
      | UserRecord
      | null
    if (!existing) {
      return json(404, { error: '존재하지 않는 아이디입니다. 먼저 회원가입해 주세요.' })
    }
    return json(200, {
      user: { username: existing.username, createdAt: existing.createdAt },
    })
  }

  return json(400, { error: '지원하지 않는 요청입니다.' })
}
