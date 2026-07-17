import { describe, expect, it } from 'vitest'
import { NightOverlaySystem } from '@/systems/lighting/NightOverlaySystem'

describe('NightOverlaySystem', () => {
  it('fades in toward night alpha after setTimeOfDay(night)', () => {
    const system = new NightOverlaySystem()
    expect(system.overlay.alpha).toBe(0)

    system.setTimeOfDay('night')
    system.update(1)

    expect(system.overlay.alpha).toBeGreaterThan(0)
    expect(system.overlay.alpha).toBeLessThanOrEqual(0.55)
    system.destroy()
  })

  it('reaches full night alpha after enough update time', () => {
    const system = new NightOverlaySystem()
    system.setTimeOfDay('night')
    system.update(1)

    expect(system.overlay.alpha).toBeCloseTo(0.55, 5)
    system.destroy()
  })

  it('fades back to 0 after setTimeOfDay(day)', () => {
    const system = new NightOverlaySystem()
    system.setTimeOfDay('night')
    system.update(1)
    expect(system.overlay.alpha).toBeCloseTo(0.55, 5)

    system.setTimeOfDay('day')
    system.update(1)

    expect(system.overlay.alpha).toBe(0)
    system.destroy()
  })
})
