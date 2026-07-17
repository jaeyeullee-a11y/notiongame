import { Container, Graphics } from 'pixi.js'
import type { WeatherType } from '@/schemas/garden'

type ParticleKind = 'rain' | 'snow'

type Particle = {
  g: Graphics
  kind: ParticleKind
  x: number
  y: number
  speed: number
  drift: number
  size: number
  active: boolean
}

const RAIN_COUNT = 120
const SNOW_COUNT = 80
const MAX_PARTICLES = 150

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export class WeatherSystem {
  readonly container = new Container()
  private readonly pool: Particle[] = []
  private active = true
  private currentWeather: WeatherType = 'clear'

  constructor() {
    this.container.label = 'weather'
    this.container.eventMode = 'none'

    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const g = new Graphics()
      g.visible = false
      this.container.addChild(g)
      this.pool.push({
        g,
        kind: 'rain',
        x: 0,
        y: 0,
        speed: 0,
        drift: 0,
        size: 1,
        active: false,
      })
    }
  }

  setActive(active: boolean): void {
    this.active = active
    if (!active) {
      this.hideAll()
    }
  }

  update(
    delta: number,
    weather: WeatherType,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    if (!this.active || prefersReducedMotion() || weather === 'clear') {
      if (this.currentWeather !== 'clear' || weather === 'clear') {
        this.hideAll()
      }
      this.currentWeather = weather
      return
    }

    const width = Math.max(1, viewportWidth)
    const height = Math.max(1, viewportHeight)

    if (this.currentWeather !== weather) {
      this.configureForWeather(weather, width, height)
      this.currentWeather = weather
    }

    for (const particle of this.pool) {
      if (!particle.active) continue

      if (particle.kind === 'rain') {
        particle.x += particle.drift * delta
        particle.y += particle.speed * delta
        if (particle.y > height + 20 || particle.x < -20 || particle.x > width + 20) {
          this.resetParticle(particle, width, height, true)
        }
      } else {
        particle.drift += delta * 1.4
        particle.x += Math.sin(particle.drift) * 12 * delta
        particle.y += particle.speed * delta
        if (particle.y > height + 20) {
          this.resetParticle(particle, width, height, true)
        }
      }
      particle.g.position.set(particle.x, particle.y)
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.pool.length = 0
  }

  private hideAll(): void {
    for (const particle of this.pool) {
      particle.active = false
      particle.g.visible = false
      particle.g.clear()
    }
  }

  private configureForWeather(
    weather: Exclude<WeatherType, 'clear'>,
    width: number,
    height: number,
  ): void {
    this.hideAll()
    const count = Math.min(
      MAX_PARTICLES,
      weather === 'rain' ? RAIN_COUNT : SNOW_COUNT,
    )
    for (let i = 0; i < count; i += 1) {
      const particle = this.pool[i]!
      particle.kind = weather
      particle.active = true
      this.resetParticle(particle, width, height, false)
      this.drawParticle(particle)
      particle.g.visible = true
    }
  }

  private resetParticle(
    particle: Particle,
    width: number,
    height: number,
    recycle: boolean,
  ): void {
    if (particle.kind === 'rain') {
      particle.x = Math.random() * (width + 40) - 20
      particle.y = recycle ? -Math.random() * 40 : Math.random() * height
      particle.speed = 420 + Math.random() * 220
      particle.drift = -80 - Math.random() * 40
      particle.size = 1 + Math.random() * 1.5
    } else {
      particle.x = Math.random() * width
      particle.y = recycle ? -Math.random() * 40 : Math.random() * height
      particle.speed = 28 + Math.random() * 36
      particle.drift = Math.random() * Math.PI * 2
      particle.size = 1.5 + Math.random() * 2.5
    }
    particle.g.position.set(particle.x, particle.y)
  }

  private drawParticle(particle: Particle): void {
    particle.g.clear()
    if (particle.kind === 'rain') {
      particle.g.rect(0, 0, 1.2, 10 + particle.size * 2)
      particle.g.fill({ color: '#9ec4d0', alpha: 0.55 })
      particle.g.rotation = -0.35
    } else {
      particle.g.circle(0, 0, particle.size)
      particle.g.fill({ color: '#ffffff', alpha: 0.75 })
      particle.g.rotation = 0
    }
  }
}
