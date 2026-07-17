import { describe, expect, it } from 'vitest'
import { normalizeUsername, usernameKey, validateUsername } from '@/lib/username'

describe('username validation', () => {
  it('requires at least 3 characters', () => {
    expect(validateUsername('ab')).toBe('아이디는 최소 3글자여야 합니다.')
    expect(validateUsername('abc')).toBeNull()
  })

  it('rejects unsupported characters', () => {
    expect(validateUsername('bad name')).not.toBeNull()
    expect(validateUsername('ok_name-1')).toBeNull()
  })

  it('normalizes and lowercases keys for uniqueness', () => {
    expect(normalizeUsername('  Fox  ')).toBe('Fox')
    expect(usernameKey('Fox')).toBe('fox')
    expect(usernameKey('FOX')).toBe(usernameKey('fox'))
  })
})
