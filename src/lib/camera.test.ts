import { describe, expect, it } from 'vitest'
import { clampCamera, clampZoom, screenToWorld, worldToScreen } from '@/lib/camera'

describe('camera', () => {
  it('clamps zoom to configured range', () => {
    expect(clampZoom(0.1)).toBe(0.5)
    expect(clampZoom(4)).toBe(2)
    expect(clampZoom(1.25)).toBe(1.25)
  })

  it('converts between screen and world space', () => {
    const camera = { x: 100, y: 200, zoom: 2 }
    const world = screenToWorld(40, 60, camera)
    expect(world).toEqual({ x: 120, y: 230 })
    expect(worldToScreen(world.x, world.y, camera)).toEqual({ x: 40, y: 60 })
  })

  it('keeps camera inside padded world bounds', () => {
    const camera = clampCamera({ x: -9999, y: -9999, zoom: 1 }, 1200, 800)
    expect(camera.x).toBe(-200)
    expect(camera.y).toBe(-200)
  })
})
