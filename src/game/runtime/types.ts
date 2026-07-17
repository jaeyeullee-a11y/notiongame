import type { EnemyId, TowerId } from '@/types'

export interface RuntimeEnemy {
  id: string
  type: EnemyId
  hp: number
  maxHp: number
  distance: number
  x: number
  y: number
  alive: boolean
  converted: boolean
  slowUntil: number
  freezeUntil: number
  baseSpeed: number
  leaked: boolean
}

export interface RuntimeTower {
  id: string
  slotId: string
  type: TowerId
  level: number
  x: number
  y: number
  spent: number
  cooldownMs: number
  kills: number
}

export interface RuntimeProjectile {
  id: string
  x: number
  y: number
  targetId: string
  towerId: string
  damage: number
  color: string
  speed: number
  towerType: TowerId
  towerLevel: number
  alive: boolean
}

export interface FloatingText {
  id: string
  x: number
  y: number
  text: string
  color: string
  lifeMs: number
}

export interface GameSnapshot {
  runway: number
  maxRunway: number
  budget: number
  wave: number
  phase: 'ready' | 'combat' | 'won' | 'lost'
  remainingEnemies: number
  score: number
  speed: 1 | 2
  paused: boolean
  founderAbilityAvailable: boolean
  hasFounder: boolean
  enemiesDefeated: number
  enemiesLeaked: number
  playTimeMs: number
}
