import theme from '@/data/theme.json'
import type { CameraState } from '@/schemas/garden'

const { width: WORLD_W, height: WORLD_H, cameraPadding: PAD } = theme.world

export function clampZoom(zoom: number): number {
  return Math.min(theme.world.maxZoom, Math.max(theme.world.minZoom, zoom))
}

export function clampCamera(
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
): CameraState {
  const zoom = clampZoom(camera.zoom)
  const viewW = viewportWidth / zoom
  const viewH = viewportHeight / zoom

  const minX = -PAD
  const minY = -PAD
  const maxX = WORLD_W + PAD - viewW
  const maxY = WORLD_H + PAD - viewH

  return {
    x: Math.min(Math.max(camera.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(camera.y, minY), Math.max(minY, maxY)),
    zoom,
  }
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: CameraState,
): { x: number; y: number } {
  return {
    x: camera.x + screenX / camera.zoom,
    y: camera.y + screenY / camera.zoom,
  }
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState,
): { x: number; y: number } {
  return {
    x: (worldX - camera.x) * camera.zoom,
    y: (worldY - camera.y) * camera.zoom,
  }
}

export function defaultCamera(
  viewportWidth = theme.world.initialViewportWidth,
  viewportHeight = theme.world.initialViewportHeight,
): CameraState {
  const zoom = theme.world.defaultZoom
  return clampCamera(
    {
      x: (WORLD_W - viewportWidth / zoom) / 2,
      y: (WORLD_H - viewportHeight / zoom) / 2,
      zoom,
    },
    viewportWidth,
    viewportHeight,
  )
}
