export function normalizeUsername(raw: string): string {
  return raw.trim()
}

export function usernameKey(raw: string): string {
  return normalizeUsername(raw).toLowerCase()
}

/** Returns an error message, or null when valid. */
export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw)
  if (username.length < 3) return '아이디는 최소 3글자여야 합니다.'
  if (username.length > 24) return '아이디는 최대 24글자입니다.'
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) {
    return '아이디는 글자·숫자·_·- 만 사용할 수 있습니다.'
  }
  return null
}
