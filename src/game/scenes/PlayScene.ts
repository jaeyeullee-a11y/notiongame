import Phaser from 'phaser'
import { ENEMIES } from '@/data/enemies'
import { MAP_LABELS, PATH, SLOTS } from '@/data/map'
import { TOWERS } from '@/data/towers'
import type { GameRuntime } from '@/game/runtime/GameRuntime'
import type { TowerId } from '@/types'

export type UiBridge = {
  onHud: () => void
  onPanel: () => void
  onGameOver: (result: 'won' | 'lost') => void
  onTutorialEvent: (event: string, payload?: unknown) => void
}

function hexToInt(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color
}

export class PlayScene extends Phaser.Scene {
  runtime!: GameRuntime
  bridge!: UiBridge

  private mapGfx!: Phaser.GameObjects.Graphics
  private entityGfx!: Phaser.GameObjects.Graphics
  private rangeGfx!: Phaser.GameObjects.Graphics
  private selectedSlotId: string | null = null
  private selectedTowerId: string | null = null
  private hudAccum = 0
  private floaterTexts = new Map<string, Phaser.GameObjects.Text>()
  private unsub: (() => void) | null = null

  constructor() {
    super('PlayScene')
  }

  init(data: { runtime: GameRuntime; bridge: UiBridge }): void {
    this.runtime = data.runtime
    this.bridge = data.bridge
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1c2e')
    this.mapGfx = this.add.graphics()
    this.entityGfx = this.add.graphics()
    this.rangeGfx = this.add.graphics()
    this.drawMap()
    this.createSlots()

    this.unsub = this.runtime.on((event, payload) => {
      if (event === 'ui') {
        this.bridge.onHud()
        this.bridge.onPanel()
      }
      if (event === 'game_over') this.bridge.onGameOver(payload as 'won' | 'lost')
      if (event === 'tower_placed' || event === 'wave_started' || event === 'enemy_defeated') {
        this.bridge.onTutorialEvent(event, payload)
      }
    })

    this.bridge.onHud()
    this.bridge.onPanel()
  }

  shutdown(): void {
    this.unsub?.()
    this.unsub = null
  }

  private drawMap(): void {
    const g = this.mapGfx
    g.clear()

    g.lineStyle(22, 0x1e3a5f, 0.9)
    g.beginPath()
    g.moveTo(PATH[0]!.x, PATH[0]!.y)
    for (let i = 1; i < PATH.length; i += 1) g.lineTo(PATH[i]!.x, PATH[i]!.y)
    g.strokePath()

    g.lineStyle(8, 0x4b7cac, 1)
    g.beginPath()
    g.moveTo(PATH[0]!.x, PATH[0]!.y)
    for (let i = 1; i < PATH.length; i += 1) g.lineTo(PATH[i]!.x, PATH[i]!.y)
    g.strokePath()

    for (const node of PATH) {
      g.fillStyle(0x93c5fd, 1)
      g.fillCircle(node.x, node.y, 7)
    }

    const core = PATH[PATH.length - 1]!
    g.fillStyle(0x3ecf8e, 0.25)
    g.fillCircle(core.x, core.y, 28)
    g.lineStyle(2, 0x3ecf8e, 1)
    g.strokeCircle(core.x, core.y, 28)

    for (const label of MAP_LABELS) {
      this.add
        .text(label.x, label.y, label.text, {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '12px',
          color: '#b7c7d9',
        })
        .setOrigin(0.5)
    }
  }

  private createSlots(): void {
    for (const slot of SLOTS) {
      const hit = this.add.circle(slot.x, slot.y, 20, 0x000000, 0.001)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.handleSlotClick(slot.id))
    }
  }

  private handleSlotClick(slotId: string): void {
    if (this.runtime.paused) return
    const occupied = this.runtime.towers.find((t) => t.slotId === slotId)
    if (occupied) {
      this.selectedTowerId = occupied.id
      this.selectedSlotId = null
    } else {
      this.selectedSlotId = slotId
      this.selectedTowerId = null
    }
    this.bridge.onPanel()
  }

  placeTower(type: TowerId): boolean {
    if (!this.selectedSlotId) return false
    const slotId = this.selectedSlotId
    const ok = this.runtime.placeTower(slotId, type)
    if (ok) {
      const tower = this.runtime.towers.find((t) => t.slotId === slotId)
      this.selectedTowerId = tower?.id ?? null
      this.selectedSlotId = null
      this.bridge.onPanel()
    }
    return ok
  }

  clearSelection(): void {
    this.selectedSlotId = null
    this.selectedTowerId = null
    this.bridge.onPanel()
  }

  getSelection(): { slotId: string | null; towerId: string | null } {
    return { slotId: this.selectedSlotId, towerId: this.selectedTowerId }
  }

  update(_time: number, delta: number): void {
    if (!this.runtime) return
    this.runtime.update(delta)
    this.redrawEntities()
    this.hudAccum += delta
    if (this.hudAccum >= 200) {
      this.hudAccum = 0
      this.bridge.onHud()
    }
  }

  private redrawEntities(): void {
    const g = this.entityGfx
    g.clear()
    this.rangeGfx.clear()

    for (const slot of SLOTS) {
      const occupied = this.runtime.towers.some((t) => t.slotId === slot.id)
      g.lineStyle(2, this.selectedSlotId === slot.id ? 0x3ecf8e : 0x6b8aab, 1)
      g.fillStyle(occupied ? 0x12324d : 0x0f2740, 0.85)
      g.fillCircle(slot.x, slot.y, 18)
      g.strokeCircle(slot.x, slot.y, 18)
    }

    for (const tower of this.runtime.towers) {
      const def = TOWERS[tower.type]
      const color = hexToInt(def.color)
      g.fillStyle(color, 1)
      g.fillCircle(tower.x, tower.y, 14)
      g.lineStyle(2, 0xffffff, 0.7)
      g.strokeCircle(tower.x, tower.y, 14)

      if (this.selectedTowerId === tower.id) {
        const range =
          tower.type === 'pm'
            ? (TOWERS.pm.levels[tower.level - 1]?.supportRange ?? 140)
            : (TOWERS[tower.type].levels[tower.level - 1]?.range ?? 120)
        this.rangeGfx.lineStyle(1, color, 0.45)
        this.rangeGfx.strokeCircle(tower.x, tower.y, range)
      }

      for (let i = 0; i < tower.level; i += 1) {
        g.fillStyle(0xffffff, 0.9)
        g.fillCircle(tower.x - 8 + i * 8, tower.y + 20, 2.5)
      }
    }

    for (const enemy of this.runtime.enemies) {
      if (!enemy.alive) continue
      const def = ENEMIES[enemy.type]
      const color = hexToInt(def.color)
      const r = def.isBoss ? 16 : 10
      g.fillStyle(color, 1)
      g.fillCircle(enemy.x, enemy.y, r)
      if (enemy.converted) {
        g.lineStyle(2, 0xfbbf24, 1)
        g.strokeCircle(enemy.x, enemy.y, r + 3)
      }
      const pct = Math.max(0, enemy.hp / enemy.maxHp)
      g.fillStyle(0x111827, 0.8)
      g.fillRect(enemy.x - 12, enemy.y - r - 10, 24, 4)
      g.fillStyle(0x3ecf8e, 1)
      g.fillRect(enemy.x - 12, enemy.y - r - 10, 24 * pct, 4)
    }

    for (const p of this.runtime.projectiles) {
      g.fillStyle(hexToInt(p.color), 1)
      g.fillCircle(p.x, p.y, 3)
    }

    this.syncFloaters()
  }

  private syncFloaters(): void {
    const alive = new Set(this.runtime.floaters.map((f) => f.id))
    for (const [id, text] of this.floaterTexts) {
      if (!alive.has(id)) {
        text.destroy()
        this.floaterTexts.delete(id)
      }
    }
    for (const f of this.runtime.floaters) {
      let text = this.floaterTexts.get(f.id)
      if (!text) {
        text = this.add
          .text(f.x, f.y, f.text, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '13px',
            color: f.color,
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
        this.floaterTexts.set(f.id, text)
      }
      const t = 1 - f.lifeMs / 900
      text.setPosition(f.x, f.y - t * 24)
      text.setAlpha(Math.max(0, 1 - t))
    }
  }
}
