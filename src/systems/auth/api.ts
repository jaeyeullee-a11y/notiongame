import { normalizeUsername, usernameKey, validateUsername } from '@/lib/username'
import { db, type UserRecord } from '@/systems/save/db'

export type AuthUser = {
  username: string
  createdAt: string
}

async function cloudAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'probe' }),
    })
    // Function exists if we get a JSON API response (not SPA HTML / 404 page).
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('application/json')) return false
    // Unknown action should still return our API error JSON (400), not a platform 404.
    return res.status !== 404
  } catch {
    return false
  }
}

let cloudMode: boolean | null = null

export async function isCloudAuthEnabled(): Promise<boolean> {
  if (cloudMode !== null) return cloudMode
  cloudMode = await cloudAvailable()
  return cloudMode
}

async function localSignup(username: string): Promise<AuthUser> {
  const key = usernameKey(username)
  const existing = await db.users.get(key)
  if (existing) {
    throw new Error('이미 사용 중인 아이디입니다.')
  }
  const record: UserRecord = {
    usernameLower: key,
    username: normalizeUsername(username),
    createdAt: new Date().toISOString(),
  }
  await db.users.put(record)
  return { username: record.username, createdAt: record.createdAt }
}

async function localLogin(username: string): Promise<AuthUser> {
  const key = usernameKey(username)
  const existing = await db.users.get(key)
  if (!existing) {
    throw new Error('존재하지 않는 아이디입니다. 먼저 회원가입해 주세요.')
  }
  return { username: existing.username, createdAt: existing.createdAt }
}

async function cloudRequest(
  action: 'signup' | 'login',
  username: string,
): Promise<AuthUser> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, username }),
  })
  const data = (await res.json()) as { user?: AuthUser; error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? '계정 요청에 실패했습니다.')
  }
  if (!data.user) throw new Error('계정 응답이 올바르지 않습니다.')
  return data.user
}

export async function signup(rawUsername: string): Promise<AuthUser> {
  const error = validateUsername(rawUsername)
  if (error) throw new Error(error)
  const username = normalizeUsername(rawUsername)
  if (await isCloudAuthEnabled()) {
    return cloudRequest('signup', username)
  }
  return localSignup(username)
}

export async function login(rawUsername: string): Promise<AuthUser> {
  const error = validateUsername(rawUsername)
  if (error) throw new Error(error)
  const username = normalizeUsername(rawUsername)
  if (await isCloudAuthEnabled()) {
    return cloudRequest('login', username)
  }
  return localLogin(username)
}
