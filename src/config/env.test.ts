import { describe, expect, it } from 'vitest'
import { appConfig } from './env'

describe('appConfig', () => {
  it('exposes a non-empty app title', () => {
    expect(appConfig.title.length).toBeGreaterThan(0)
  })

  it('keeps feature flags disabled by default in scaffold', () => {
    expect(appConfig.features.vocSubmit).toBe(false)
    expect(appConfig.features.playLog).toBe(false)
  })
})
