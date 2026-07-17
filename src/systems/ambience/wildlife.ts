import { Container, Graphics } from 'pixi.js'
import { assetsById } from '@/lib/assets'
import type { PlacedGardenObject, Season } from '@/schemas/garden'

type Butterfly = {
  g: Graphics
  x: number
  y: number
  t: number
  speed: number
  amp: number
}

type Bird = {
  g: Graphics
  x: number
  y: number
  tx: number
  ty: number
  t: number
  landed: boolean
}

export class WildlifeSystem {
  readonly container = new Container()
  private butterflies: Butterfly[] = []
  private bird: Bird | null = null

  constructor() {
    this.container.label = 'wildlife'
  }

  update(delta: number, objects: PlacedGardenObject[], season: Season): void {
    const flowers = objects.filter((o) => assetsById.get(o.assetId)?.category === 'flowers')
    const trees = objects.filter((o) => assetsById.get(o.assetId)?.category === 'trees')
    const birdBath = objects.find((o) => o.assetId === 'bird-bath')

    const butterflyTarget =
      season === 'winter'
        ? 0
        : flowers.length >= 3
          ? Math.min(2, Math.floor(flowers.length / 3) || 1)
          : 0
    while (this.butterflies.length < butterflyTarget) {
      const anchor = flowers[this.butterflies.length % flowers.length]!
      this.butterflies.push(this.spawnButterfly(anchor.x, anchor.y - 40))
    }
    while (this.butterflies.length > butterflyTarget) {
      const removed = this.butterflies.pop()
      removed?.g.destroy()
    }

    if (trees.length >= 2) {
      if (!this.bird) {
        const start = trees[0]!
        const target = birdBath ?? trees[1]!
        this.bird = this.spawnBird(start.x, start.y - 120, target.x, target.y - 40)
      } else if (birdBath) {
        this.bird.tx = birdBath.x
        this.bird.ty = birdBath.y - 40
      }
    } else if (this.bird) {
      this.bird.g.destroy()
      this.bird = null
    }

    for (const butterfly of this.butterflies) {
      butterfly.t += delta * butterfly.speed
      butterfly.x += Math.cos(butterfly.t) * butterfly.amp * delta
      butterfly.y += Math.sin(butterfly.t * 1.7) * butterfly.amp * 0.6 * delta
      butterfly.g.position.set(butterfly.x, butterfly.y)
      butterfly.g.rotation = Math.sin(butterfly.t * 8) * 0.4
      butterfly.g.scale.x = Math.cos(butterfly.t * 10) > 0 ? 1 : -1
    }

    if (this.bird) {
      this.bird.t += delta
      const dx = this.bird.tx - this.bird.x
      const dy = this.bird.ty - this.bird.y
      const dist = Math.hypot(dx, dy)
      if (dist > 4) {
        this.bird.landed = false
        this.bird.x += (dx / dist) * 40 * delta
        this.bird.y += (dy / dist) * 40 * delta
        this.bird.g.rotation = Math.atan2(dy, dx) * 0.15
      } else {
        this.bird.landed = true
        this.bird.g.rotation = Math.sin(this.bird.t * 2) * 0.05
        this.bird.y += Math.sin(this.bird.t * 3) * 0.02
      }
      this.bird.g.position.set(this.bird.x, this.bird.y)
    }
  }

  private spawnButterfly(x: number, y: number): Butterfly {
    const g = new Graphics()
    g.ellipse(-4, 0, 6, 4)
    g.fill({ color: '#E8C27A', alpha: 0.9 })
    g.ellipse(4, 0, 6, 4)
    g.fill({ color: '#F0D59A', alpha: 0.9 })
    g.circle(0, 0, 1.5)
    g.fill({ color: '#405B45' })
    this.container.addChild(g)
    return {
      g,
      x,
      y,
      t: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.6,
      amp: 18 + Math.random() * 12,
    }
  }

  private spawnBird(x: number, y: number, tx: number, ty: number): Bird {
    const g = new Graphics()
    g.ellipse(0, 0, 8, 4)
    g.fill({ color: '#5C6356' })
    g.moveTo(-2, 0)
    g.lineTo(-12, -4)
    g.lineTo(-2, 2)
    g.fill({ color: '#405B45' })
    this.container.addChild(g)
    return { g, x, y, tx, ty, t: 0, landed: false }
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.butterflies = []
    this.bird = null
  }
}
