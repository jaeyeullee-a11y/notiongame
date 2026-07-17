import { GAME } from './constants'

export interface Vec2 {
  x: number
  y: number
}

export interface PathNode extends Vec2 {
  label: string
}

export interface SlotDef {
  id: string
  x: number
  y: number
}

/** Customer Inbox → Backlog → Build → Launch → Product Core */
export const PATH: PathNode[] = [
  { x: 40, y: 270, label: 'Customer Inbox' },
  { x: 180, y: 140, label: 'Backlog' },
  { x: 360, y: 140, label: 'Build' },
  { x: 520, y: 320, label: 'Build' },
  { x: 700, y: 320, label: 'Launch' },
  { x: 820, y: 180, label: 'Launch' },
  { x: 920, y: 270, label: 'Product Core' },
]

export const SLOTS: SlotDef[] = [
  { id: 's1', x: 140, y: 230 },
  { id: 's2', x: 240, y: 230 },
  { id: 's3', x: 320, y: 230 },
  { id: 's4', x: 420, y: 230 },
  { id: 's5', x: 480, y: 400 },
  { id: 's6', x: 580, y: 400 },
  { id: 's7', x: 640, y: 230 },
  { id: 's8', x: 740, y: 230 },
  { id: 's9', x: 800, y: 360 },
  { id: 's10', x: 860, y: 360 },
]

export const MAP_LABELS = [
  { text: 'Customer Inbox', x: 70, y: 310 },
  { text: 'Backlog', x: 180, y: 110 },
  { text: 'Build', x: 400, y: 110 },
  { text: 'Launch', x: 740, y: 140 },
  { text: 'Product Core', x: 900, y: 310 },
] as const

export function pathLength(points: Vec2[] = PATH): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

export const PATH_TOTAL_LENGTH = pathLength()

export function positionAlongPath(distance: number, points: Vec2[] = PATH): Vec2 {
  if (distance <= 0) return { ...points[0]! }
  let remaining = distance
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (remaining <= seg) {
      const t = remaining / seg
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    remaining -= seg
  }
  const last = points[points.length - 1]!
  return { x: last.x, y: last.y }
}

export const CANVAS = { width: GAME.WIDTH, height: GAME.HEIGHT }
