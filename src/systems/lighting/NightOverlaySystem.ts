import { Graphics } from 'pixi.js'
import theme from '@/data/theme.json'

export class NightOverlaySystem {
  readonly overlay: Graphics
  private targetAlpha = 0
  private currentAlpha = 0

  constructor() {
    this.overlay = new Graphics()
    const { width, height } = theme.world
    // Deep blue-black night wash (rgba(15,15,45) at target alpha 0.55)
    this.overlay.rect(0, 0, width, height).fill({ color: 0x0f0f2d, alpha: 1 })
    this.overlay.alpha = 0
    this.overlay.eventMode = 'none'
    this.overlay.label = 'nightOverlay'
  }

  setTimeOfDay(mode: 'day' | 'night'): void {
    this.targetAlpha = mode === 'night' ? 0.55 : 0
  }

  update(deltaSeconds: number): void {
    const speed = 0.9
    if (this.currentAlpha < this.targetAlpha) {
      this.currentAlpha = Math.min(
        this.targetAlpha,
        this.currentAlpha + speed * deltaSeconds,
      )
    } else if (this.currentAlpha > this.targetAlpha) {
      this.currentAlpha = Math.max(
        this.targetAlpha,
        this.currentAlpha - speed * deltaSeconds,
      )
    }
    this.overlay.alpha = this.currentAlpha
  }

  destroy(): void {
    this.overlay.destroy()
  }
}
