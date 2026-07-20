import { describe, expect, it, vi } from 'vitest'
import { screenToWorld } from '@/lib/camera'
import {
  LONG_PRESS_MS,
  LONG_PRESS_MOVE_TOLERANCE_PX,
  LongPressDetector,
  computePinchCamera,
  getTouchDistance,
  getTouchMidpoint,
  isBeyondLongPressTolerance,
} from '@/lib/touchGestures'

describe('getTouchDistance / getTouchMidpoint', () => {
  it('computes distance between two contact points', () => {
    expect(getTouchDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('computes midpoint between two contact points', () => {
    expect(getTouchMidpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({
      x: 5,
      y: 10,
    })
  })
})

describe('핀치 줌 계산', () => {
  it('핀치에서 줌 비율을 올바르게 적용한다', () => {
    const startCamera = { x: 0, y: 0, zoom: 1 }
    const startMidpoint = { x: 200, y: 200 }
    const next = computePinchCamera({
      startCamera,
      startDistance: 100,
      startMidpoint,
      currentDistance: 150,
      currentMidpoint: startMidpoint,
      viewportWidth: 1200,
      viewportHeight: 800,
    })

    expect(next.zoom).toBe(1.5)
    const worldBefore = screenToWorld(
      startMidpoint.x,
      startMidpoint.y,
      startCamera,
    )
    const worldAfter = screenToWorld(startMidpoint.x, startMidpoint.y, next)
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 5)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 5)
  })

  it('핀치 줌을 minZoom으로 클램프한다', () => {
    const next = computePinchCamera({
      startCamera: { x: 100, y: 100, zoom: 0.6 },
      startDistance: 200,
      startMidpoint: { x: 300, y: 300 },
      currentDistance: 40,
      currentMidpoint: { x: 300, y: 300 },
      viewportWidth: 1200,
      viewportHeight: 800,
    })
    expect(next.zoom).toBe(0.5)
  })

  it('핀치 줌을 maxZoom으로 클램프한다', () => {
    const next = computePinchCamera({
      startCamera: { x: 100, y: 100, zoom: 1.5 },
      startDistance: 100,
      startMidpoint: { x: 300, y: 300 },
      currentDistance: 400,
      currentMidpoint: { x: 300, y: 300 },
      viewportWidth: 1200,
      viewportHeight: 800,
    })
    expect(next.zoom).toBe(2)
  })

  it('두 손가락 중점 이동으로 팬한다', () => {
    const startCamera = { x: 100, y: 100, zoom: 1 }
    const next = computePinchCamera({
      startCamera,
      startDistance: 100,
      startMidpoint: { x: 200, y: 200 },
      currentDistance: 100,
      currentMidpoint: { x: 260, y: 220 },
      viewportWidth: 1200,
      viewportHeight: 800,
    })
    expect(next.zoom).toBe(1)
    expect(next.x).toBeCloseTo(40, 5)
    expect(next.y).toBeCloseTo(80, 5)
  })
})

describe('Long-press 디텍터', () => {
  it('500ms / 8px 임계값을 노출한다', () => {
    expect(LONG_PRESS_MS).toBe(500)
    expect(LONG_PRESS_MOVE_TOLERANCE_PX).toBe(8)
  })

  it('500ms 충족 시 onLongPress를 호출한다', () => {
    vi.useFakeTimers()
    const detector = new LongPressDetector()
    const onFire = vi.fn()
    detector.start({ x: 10, y: 10 }, onFire)
    vi.advanceTimersByTime(499)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onFire).toHaveBeenCalledTimes(1)
    expect(detector.didFire()).toBe(true)
    vi.useRealTimers()
  })

  it('8px 이동 시 long-press를 취소한다', () => {
    vi.useFakeTimers()
    const detector = new LongPressDetector()
    const onFire = vi.fn()
    detector.start({ x: 0, y: 0 }, onFire)
    detector.move({ x: 9, y: 0 })
    vi.advanceTimersByTime(600)
    expect(onFire).not.toHaveBeenCalled()
    expect(
      isBeyondLongPressTolerance({ x: 0, y: 0 }, { x: 8, y: 0 }),
    ).toBe(false)
    expect(
      isBeyondLongPressTolerance({ x: 0, y: 0 }, { x: 9, y: 0 }),
    ).toBe(true)
    vi.useRealTimers()
  })

  it('pointerup(cancel) 시 long-press를 취소한다', () => {
    vi.useFakeTimers()
    const detector = new LongPressDetector()
    const onFire = vi.fn()
    detector.start({ x: 0, y: 0 }, onFire)
    detector.cancel()
    vi.advanceTimersByTime(600)
    expect(onFire).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
