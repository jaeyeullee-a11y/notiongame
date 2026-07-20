import { clampCamera, clampZoom, screenToWorld } from '@/lib/camera'
import type { CameraState } from '@/schemas/garden'

export const LONG_PRESS_MS = 500
export const LONG_PRESS_MOVE_TOLERANCE_PX = 8

export type TouchPoint = { x: number; y: number }

/** Distance between two touch points in screen space. */
export function getTouchDistance(a: TouchPoint, b: TouchPoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

/** Midpoint between two touch points in screen space. */
export function getTouchMidpoint(a: TouchPoint, b: TouchPoint): TouchPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

/**
 * Compute camera after a pinch/pan gesture.
 * Keeps the world point under the gesture-start midpoint pinned to the
 * current midpoint while scaling zoom by the distance ratio.
 */
export function computePinchCamera(options: {
  startCamera: CameraState
  startDistance: number
  startMidpoint: TouchPoint
  currentDistance: number
  currentMidpoint: TouchPoint
  viewportWidth: number
  viewportHeight: number
}): CameraState {
  const {
    startCamera,
    startDistance,
    startMidpoint,
    currentDistance,
    currentMidpoint,
    viewportWidth,
    viewportHeight,
  } = options

  const safeStart = Math.max(startDistance, 0.0001)
  const nextZoom = clampZoom(
    startCamera.zoom * (currentDistance / safeStart),
  )
  const worldPivot = screenToWorld(
    startMidpoint.x,
    startMidpoint.y,
    startCamera,
  )

  return clampCamera(
    {
      x: worldPivot.x - currentMidpoint.x / nextZoom,
      y: worldPivot.y - currentMidpoint.y / nextZoom,
      zoom: nextZoom,
    },
    viewportWidth,
    viewportHeight,
  )
}

export function isBeyondLongPressTolerance(
  start: TouchPoint,
  current: TouchPoint,
  tolerancePx = LONG_PRESS_MOVE_TOLERANCE_PX,
): boolean {
  return getTouchDistance(start, current) > tolerancePx
}

/** Testable long-press detector with move tolerance. */
export class LongPressDetector {
  private timer: ReturnType<typeof setTimeout> | null = null
  private origin: TouchPoint | null = null
  private fired = false

  start(
    point: TouchPoint,
    onFire: () => void,
    durationMs = LONG_PRESS_MS,
  ): void {
    this.cancel()
    this.origin = point
    this.fired = false
    this.timer = setTimeout(() => {
      this.timer = null
      this.fired = true
      onFire()
    }, durationMs)
  }

  move(point: TouchPoint): void {
    if (!this.origin) return
    if (isBeyondLongPressTolerance(this.origin, point)) {
      this.cancel()
    }
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.origin = null
  }

  didFire(): boolean {
    return this.fired
  }

  resetFired(): void {
    this.fired = false
  }
}
