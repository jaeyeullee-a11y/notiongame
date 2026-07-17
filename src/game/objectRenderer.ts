import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { assetsById } from '@/lib/assets'
import { sortObjectsByDepth } from '@/lib/depth'
import type { PlacedGardenObject } from '@/schemas/garden'

type ObjectVisual = {
  root: Container
  sprite: Sprite
  footprint: Graphics
}

export class ObjectRenderer {
  readonly container = new Container()
  private readonly visuals = new Map<string, ObjectVisual>()
  private textures = new Map<string, Texture>()
  private selectedId: string | null = null
  private ghost: ObjectVisual | null = null

  constructor() {
    this.container.label = 'objects'
    this.container.sortableChildren = true
  }

  async loadTextures(): Promise<void> {
    const urls = [...new Set([...assetsById.values()].map((a) => a.spriteUrl))]
    await Promise.all(
      urls.map(async (url) => {
        const texture = await Assets.load<Texture>(url)
        this.textures.set(url, texture)
      }),
    )
  }

  sync(
    objects: PlacedGardenObject[],
    selectedId: string | null,
    showFootprints: boolean,
  ): void {
    this.selectedId = selectedId
    const alive = new Set(objects.map((o) => o.instanceId))

    for (const [id, visual] of this.visuals) {
      if (!alive.has(id)) {
        visual.root.destroy({ children: true })
        this.visuals.delete(id)
      }
    }

    for (const object of sortObjectsByDepth(objects)) {
      let visual = this.visuals.get(object.instanceId)
      if (!visual) {
        visual = this.createVisual(object.assetId)
        this.visuals.set(object.instanceId, visual)
        this.container.addChild(visual.root)
      }
      this.applyTransform(visual, object, showFootprints && selectedId === object.instanceId)
    }
  }

  setGhost(
    assetId: string | null,
    x: number,
    y: number,
    visible: boolean,
  ): void {
    if (!assetId || !visible) {
      if (this.ghost) this.ghost.root.visible = false
      return
    }

    if (!this.ghost || this.ghost.root.label !== `ghost:${assetId}`) {
      this.ghost?.root.destroy({ children: true })
      this.ghost = this.createVisual(assetId)
      this.ghost.root.label = `ghost:${assetId}`
      this.ghost.sprite.alpha = 0.55
      this.container.addChild(this.ghost.root)
    }

    const asset = assetsById.get(assetId)
    this.ghost.root.visible = true
    this.ghost.root.position.set(x, y)
    this.ghost.root.zIndex = y + (asset?.sortOffset ?? 0) + 10000
    this.ghost.footprint.clear()
    if (asset) {
      this.ghost.footprint.ellipse(0, 0, asset.footprintWidth / 2, asset.footprintHeight / 2)
      this.ghost.footprint.stroke({ color: '#B66D4F', alpha: 0.55, width: 2 })
    }
  }

  private createVisual(assetId: string): ObjectVisual {
    const asset = assetsById.get(assetId)
    const root = new Container()
    const footprint = new Graphics()
    const texture =
      (asset ? this.textures.get(asset.spriteUrl) : undefined) ?? Texture.WHITE
    const sprite = new Sprite(texture)
    sprite.anchor.set(asset?.anchorX ?? 0.5, asset?.anchorY ?? 1)

    if (!asset || texture === Texture.WHITE) {
      sprite.tint = 0x789267
      sprite.width = asset?.nativeWidth ?? 80
      sprite.height = asset?.nativeHeight ?? 80
    }

    root.addChild(footprint, sprite)
    return { root, sprite, footprint }
  }

  private applyTransform(
    visual: ObjectVisual,
    object: PlacedGardenObject,
    showFootprint: boolean,
  ): void {
    const asset = assetsById.get(object.assetId)
    visual.root.position.set(object.x, object.y)
    visual.root.rotation = (object.rotation * Math.PI) / 180
    visual.root.scale.set(object.flipX ? -object.scale : object.scale, object.scale)
    visual.root.zIndex = object.y + object.sortOffset
    visual.sprite.alpha = 1

    visual.footprint.clear()
    if (showFootprint && asset) {
      visual.footprint.ellipse(
        0,
        0,
        asset.footprintWidth / 2,
        asset.footprintHeight / 2,
      )
      visual.footprint.stroke({ color: '#B66D4F', alpha: 0.7, width: 2 })
      visual.footprint.fill({ color: '#B66D4F', alpha: 0.12 })
    }
  }

  getSelectedId(): string | null {
    return this.selectedId
  }

  destroy(): void {
    this.ghost?.root.destroy({ children: true })
    this.container.destroy({ children: true })
    this.visuals.clear()
  }
}
