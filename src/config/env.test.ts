import { describe, expect, it } from 'vitest'
import { appConfig } from './env'

describe('appConfig', () => {
  it('exposes a non-empty app title', () => {
    expect(appConfig.title.length).toBeGreaterThan(0)
  })

  it('exposes feature flag booleans', () => {
    expect(typeof appConfig.features.vocSubmit).toBe('boolean')
    expect(typeof appConfig.features.playLog).toBe('boolean')
  })
})
