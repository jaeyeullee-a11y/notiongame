import { describe, expect, it } from 'vitest'
import { PATH, PATH_TOTAL_LENGTH, positionAlongPath } from './map'

describe('map path', () => {
  it('has a positive total length', () => {
    expect(PATH_TOTAL_LENGTH).toBeGreaterThan(100)
  })

  it('returns start and end positions', () => {
    const start = positionAlongPath(0)
    const end = positionAlongPath(PATH_TOTAL_LENGTH + 50)
    expect(start.x).toBeCloseTo(PATH[0]!.x)
    expect(start.y).toBeCloseTo(PATH[0]!.y)
    expect(end.x).toBeCloseTo(PATH[PATH.length - 1]!.x)
    expect(end.y).toBeCloseTo(PATH[PATH.length - 1]!.y)
  })
})
