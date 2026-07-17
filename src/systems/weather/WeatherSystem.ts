import { Container, Graphics } from 'pixi.js'
import type { WeatherType } from '@/schemas/garden'

type Particle = {
  g: Graphics
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

const RAIN_COUNT = 120
const SNOW_COUNT = 80

export class WeatherSystem {
  readonly container = new Container()
  private active = true
  private rain: Particle[] = []
  private snow: Particle[] = []
  private reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor() {
    this.container.label = 'weather'
    this.container.sortableChildren = false
    this.container.eventMode = 'none'
  }

  update(
    delta: number,
    weather: WeatherType,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    if (!this.active || this.reduceMotion || weather === 'clear') {
      this.setVisible(this.rain, false)
      this.setVisible(this.snow, false)
      return
    }

    if (weather === 'rain') {
      this.ensurePool(this.rain, RAIN_COUNT, 'rain', viewportWidth, viewportHeight)
      this.setVisible(this.rain, true)
      this.setVisible(this.snow, false)
      this.updateRain(delta, viewportWidth, viewportHeight)
      return
    }

    this.ensurePool(this.snow, SNOW_COUNT, 'snow', viewportWidth, viewportHeight)
    this.setVisible(this.rain, false)
    this.setVisible(this.snow, true)
    this.updateSnow(delta, viewportWidth, viewportHeight)
  }

  setActive(active: boolean): void {
    this.active = active
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.rain = []
    this.snow = []
  }

  private setVisible(particles: Particle[], visible: boolean): void {
    for (const particle of particles) {
      particle.g.visible = visible
    }
  }

  private ensurePool(
    particles: Particle[],
    targetSize: number,
    kind: 'rain' | 'snow',
    width: number,
    height: number,
  ): void {
    while (particles.length < targetSize) {
      const particle = this.spawnParticle(kind, width, height)
      particles.push(particle)
      this.container.addChild(particle.g)
    }
    while (particles.length > targetSize) {
      const removed = particles.pop()
      removed?.g.destroy()
    }
  }

  private spawnParticle(kind: 'rain' | 'snow', width: number, height: number): Particle {
    const g = new Graphics()
    const x = Math.random() * width
    const y = Math.random() * height

    if (kind === 'rain') {
      const size = 8 + Math.random() * 10
      g.moveTo(0, 0)
      g.lineTo(2, size)
      g.stroke({ color: '#b7d8f2', alpha: 0.7, width: 1.5 })
      return {
        g,
        x,
        y,
        vx: -90 - Math.random() * 60,
        vy: 380 + Math.random() * 220,
        size,
      }
    }

    const size = 1.5 + Math.random() * 2.5
    g.circle(0, 0, size)
    g.fill({ color: '#f4fbff', alpha: 0.85 })
    return {
      g,
      x,
      y,
      vx: -18 + Math.random() * 36,
      vy: 45 + Math.random() * 40,
      size,
    }
  }

  private updateRain(delta: number, width: number, height: number): void {
    for (const particle of this.rain) {
      particle.x += particle.vx * delta
      particle.y += particle.vy * delta
      if (particle.y > height + particle.size || particle.x < -particle.size) {
        particle.x = Math.random() * width + 40
        particle.y = -12
      }
      particle.g.position.set(particle.x, particle.y)
    }
  }

  private updateSnow(delta: number, width: number, height: number): void {
    for (const particle of this.snow) {
      particle.x += particle.vx * delta
      particle.y += particle.vy * delta
      if (particle.y > height + particle.size) {
        particle.x = Math.random() * width
        particle.y = -8
      }
      if (particle.x < -particle.size) particle.x = width + particle.size
      if (particle.x > width + particle.size) particle.x = -particle.size
      particle.g.position.set(particle.x, particle.y)
    }
  }
}
