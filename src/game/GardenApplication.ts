import { Application, Container, Graphics, Rectangle } from 'pixi.js'
import theme from '@/data/theme.json'
import { assetsById } from '@/lib/assets'
import { clampCamera, screenToWorld } from '@/lib/camera'
import { hitTestObjects } from '@/lib/hitTest'
import { createId } from '@/lib/ids'
import {
  applyTerrainPaint,
  createEmptyTerrain,
  getBrushCells,
  worldToCell,
} from '@/lib/terrainBrush'
import type { PlacedGardenObject, Season, TerrainCell } from '@/schemas/garden'
import { TerrainRenderer } from '@/game/terrainRenderer'
import { ObjectRenderer } from '@/game/objectRenderer'
import { WildlifeSystem } from '@/systems/ambience/wildlife'
import { WeatherSystem } from '@/systems/weather/WeatherSystem'
import { audioManager } from '@/systems/ambience/audio'
import {
  createClearGardenCommand,
  createDeleteObjectCommand,
  createMoveObjectCommand,
  createPaintTerrainCommand,
  createPlaceObjectCommand,
  createTransformObjectCommand,
  type ObjectMutators,
} from '@/systems/command/commands'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

export class GardenApplication {
  app: Application | null = null
  private world = new Container()
  private terrainRenderer = new TerrainRenderer()
  private objectRenderer = new ObjectRenderer()
  private wildlife = new WildlifeSystem()
  private weather = new WeatherSystem()
  private worldBounds = new Graphics()
  private brushPreview = new Graphics()
  private viewport = { width: 1200, height: 800 }
  private panning = false
  private spaceDown = false
  private painting = false
  private paintStartTerrain: TerrainCell[] | null = null
  private lastPaintCell: { x: number; y: number } | null = null
  private draggingObject = false
  private dragStart: { x: number; y: number; objX: number; objY: number } | null =
    null
  private lastPointer = { x: 0, y: 0 }
  private lastTransformAt = 0
  private pendingTransform: {
    instanceId: string
    applyTo: (patch: Partial<PlacedGardenObject>) => void
  } | null = null
  private unsubscribers: Array<() => void> = []
  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void
  private host: HTMLElement | null = null
  private destroyed = false
  private lastTerrainRef: TerrainCell[] | null = null
  private lastObjectsRef: PlacedGardenObject[] | null = null
  private lastSelectedId: string | null = null
  private lastSeason: Season | null = null
  private lastObserve = false
  private lastSnapshot = false
  private lastTool = ''
  private lastAssetId: string | null = null
  private playTimeAccumulator = 0

  constructor() {
    this.boundKeyDown = (e) => this.onKeyDown(e)
    this.boundKeyUp = (e) => this.onKeyUp(e)
  }

  async mount(host: HTMLElement): Promise<void> {
    this.host = host
    this.destroyed = false
    const app = new Application()
    await app.init({
      resizeTo: host,
      antialias: true,
      background: theme.colors.parchment,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    })
    if (this.destroyed) {
      app.destroy(true)
      return
    }
    this.app = app
    host.replaceChildren(app.canvas)
    this.viewport = { width: host.clientWidth, height: host.clientHeight }

    this.world.addChild(
      this.worldBounds,
      this.terrainRenderer.container,
      this.objectRenderer.container,
      this.wildlife.container,
      this.brushPreview,
    )
    // Weather particles use screen space and sit above the camera-transformed world.
    app.stage.addChild(this.world, this.weather.container)
    app.stage.eventMode = 'static'
    app.stage.hitArea = new Rectangle(0, 0, this.viewport.width, this.viewport.height)

    this.drawWorldBounds()
    await this.objectRenderer.loadTextures()
    if (this.destroyed) return
    this.syncFromStores(true)
    this.bindPointer(app)
    window.addEventListener('keydown', this.boundKeyDown)
    window.addEventListener('keyup', this.boundKeyUp)

    this.unsubscribers.push(
      useGardenStore.subscribe((state, prev) => {
        if (
          state.terrain !== prev.terrain ||
          state.objects !== prev.objects ||
          state.camera !== prev.camera ||
          state.season !== prev.season ||
          state.weather !== prev.weather
        ) {
          this.syncFromStores()
        }
      }),
      useEditorStore.subscribe((state, prev) => {
        if (
          state.selectedObjectId !== prev.selectedObjectId ||
          state.observeMode !== prev.observeMode ||
          state.snapshotMode !== prev.snapshotMode ||
          state.tool !== prev.tool ||
          state.selectedAssetId !== prev.selectedAssetId ||
          state.brushSize !== prev.brushSize ||
          state.terrainTypeId !== prev.terrainTypeId
        ) {
          this.syncFromStores()
        }
      }),
    )

    app.ticker.add((ticker) => {
      if (this.destroyed || !this.app) return
      const delta = ticker.deltaMS / 1000
      const garden = useGardenStore.getState()
      this.terrainRenderer.update(delta, garden.terrain, garden.season)
      this.wildlife.update(delta, garden.objects, garden.season)
      this.weather.update(
        delta,
        garden.weather,
        this.viewport.width,
        this.viewport.height,
      )
      this.playTimeAccumulator += delta
      if (this.playTimeAccumulator >= 1) {
        useGardenStore.getState().tickPlayTime(this.playTimeAccumulator)
        this.playTimeAccumulator = 0
      }
    })

    const ro = new ResizeObserver(() => {
      if (!this.host || !this.app || this.destroyed) return
      this.viewport = {
        width: this.host.clientWidth,
        height: this.host.clientHeight,
      }
      this.app.stage.hitArea = new Rectangle(
        0,
        0,
        this.viewport.width,
        this.viewport.height,
      )
      this.applyCamera()
    })
    ro.observe(host)
    this.unsubscribers.push(() => ro.disconnect())
  }

  private mutators(): ObjectMutators {
    const garden = useGardenStore.getState()
    return {
      addObject: garden.addObject,
      removeObject: garden.removeObject,
      updateObject: garden.updateObject,
      replaceObjects: garden.replaceObjects,
      replaceTerrain: garden.replaceTerrain,
      getObject: garden.getObject,
      getObjects: () => useGardenStore.getState().objects,
      getTerrain: () => useGardenStore.getState().terrain,
    }
  }

  private syncFromStores(force = false): void {
    if (this.destroyed || !this.app) return
    const garden = useGardenStore.getState()
    const editor = useEditorStore.getState()
    const seasonChanged = garden.season !== this.lastSeason

    if (force || garden.terrain !== this.lastTerrainRef || seasonChanged) {
      this.terrainRenderer.render(garden.terrain, garden.season)
      this.lastTerrainRef = garden.terrain
    }

    const showFootprints = !editor.observeMode && !editor.snapshotMode
    if (
      force ||
      garden.objects !== this.lastObjectsRef ||
      editor.selectedObjectId !== this.lastSelectedId ||
      editor.observeMode !== this.lastObserve ||
      editor.snapshotMode !== this.lastSnapshot ||
      seasonChanged
    ) {
      this.objectRenderer.sync(
        garden.objects,
        editor.selectedObjectId,
        showFootprints,
        garden.season,
      )
      this.lastObjectsRef = garden.objects
      this.lastSelectedId = editor.selectedObjectId
      this.lastObserve = editor.observeMode
      this.lastSnapshot = editor.snapshotMode
    }

    this.lastSeason = garden.season
    this.applyCamera()

    if (
      force ||
      editor.tool !== this.lastTool ||
      editor.selectedAssetId !== this.lastAssetId
    ) {
      this.updateGhost()
      this.lastTool = editor.tool
      this.lastAssetId = editor.selectedAssetId
    }
  }

  private applyCamera(): void {
    const camera = clampCamera(
      useGardenStore.getState().camera,
      this.viewport.width,
      this.viewport.height,
    )
    if (
      camera.x !== useGardenStore.getState().camera.x ||
      camera.y !== useGardenStore.getState().camera.y ||
      camera.zoom !== useGardenStore.getState().camera.zoom
    ) {
      useGardenStore.getState().setCamera(camera)
    }
    this.world.position.set(-camera.x * camera.zoom, -camera.y * camera.zoom)
    this.world.scale.set(camera.zoom)
  }

  private drawWorldBounds(): void {
    const { width, height } = theme.world
    this.worldBounds.clear()
    this.worldBounds.rect(0, 0, width, height)
    this.worldBounds.stroke({ color: '#D5CCB4', width: 4 })
  }

  private bindPointer(app: Application): void {
    app.stage.on('pointerdown', (event) => this.onPointerDown(event))
    app.stage.on('pointermove', (event) => this.onPointerMove(event))
    app.stage.on('pointerup', (event) => this.onPointerUp(event))
    app.stage.on('pointerupoutside', (event) => this.onPointerUp(event))
    app.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault()
        this.onWheel(event)
      },
      { passive: false },
    )
    app.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private getWorldPoint(globalX: number, globalY: number) {
    const camera = useGardenStore.getState().camera
    return screenToWorld(globalX, globalY, camera)
  }

  private onPointerDown(event: {
    global: { x: number; y: number }
    button: number
    ctrlKey?: boolean
    metaKey?: boolean
  }): void {
    audioManager.unlock()
    const editor = useEditorStore.getState()
    if (editor.snapshotMode) return

    const world = this.getWorldPoint(event.global.x, event.global.y)
    this.lastPointer = { x: event.global.x, y: event.global.y }

    if (event.button === 1 || this.spaceDown || editor.tool === 'pan') {
      this.panning = true
      return
    }

    if (editor.observeMode) {
      this.panning = true
      return
    }

    if (event.button === 2) {
      if (editor.tool === 'place') {
        useEditorStore.getState().setTool('select')
      }
      return
    }

    if (editor.tool === 'terrain') {
      this.painting = true
      this.paintStartTerrain = useGardenStore
        .getState()
        .terrain.map((c) => ({ ...c }))
      this.lastPaintCell = worldToCell(world.x, world.y)
      this.paintAt(world.x, world.y)
      audioManager.play('paint')
      return
    }

    if (editor.tool === 'place' && editor.selectedAssetId) {
      this.placeObject(editor.selectedAssetId, world.x, world.y)
      return
    }

    if (editor.tool === 'erase') {
      const hit = hitTestObjects(
        world.x,
        world.y,
        useGardenStore.getState().objects,
        assetsById,
      )
      if (hit) {
        useEditorStore
          .getState()
          .executeCommand(createDeleteObjectCommand(hit, this.mutators()))
        audioManager.play('delete')
      }
      return
    }

    // Select / move
    const hit = hitTestObjects(
      world.x,
      world.y,
      useGardenStore.getState().objects,
      assetsById,
      editor.selectedObjectId,
    )
    useEditorStore.getState().setSelectedObjectId(hit?.instanceId ?? null)
    useEditorStore.getState().setTool('select')
    if (hit) {
      audioManager.play('select')
      this.draggingObject = true
      this.dragStart = {
        x: world.x,
        y: world.y,
        objX: hit.x,
        objY: hit.y,
      }
    }
  }

  private onPointerMove(event: { global: { x: number; y: number } }): void {
    const editor = useEditorStore.getState()
    if (editor.observeMode && editor.observeUiHidden) {
      useEditorStore.getState().setObserveUiHidden(false)
    }

    const world = this.getWorldPoint(event.global.x, event.global.y)
    const dx = event.global.x - this.lastPointer.x
    const dy = event.global.y - this.lastPointer.y
    this.lastPointer = { x: event.global.x, y: event.global.y }

    if (this.panning) {
      const camera = useGardenStore.getState().camera
      useGardenStore.getState().setCamera(
        clampCamera(
          {
            x: camera.x - dx / camera.zoom,
            y: camera.y - dy / camera.zoom,
            zoom: camera.zoom,
          },
          this.viewport.width,
          this.viewport.height,
        ),
      )
      this.applyCamera()
      return
    }

    if (this.painting && editor.tool === 'terrain') {
      this.paintAt(world.x, world.y)
      return
    }

    if (this.draggingObject && this.dragStart && editor.selectedObjectId) {
      const nx = this.dragStart.objX + (world.x - this.dragStart.x)
      const ny = this.dragStart.objY + (world.y - this.dragStart.y)
      useGardenStore.getState().updateObject(editor.selectedObjectId, {
        x: Math.min(theme.world.width - 10, Math.max(10, nx)),
        y: Math.min(theme.world.height - 10, Math.max(10, ny)),
      })
      return
    }

    this.updateGhost(world.x, world.y)
    this.updateBrushPreview(world.x, world.y)
  }

  private onPointerUp(_event: { global: { x: number; y: number } }): void {
    if (this.painting && this.paintStartTerrain) {
      const next = useGardenStore.getState().terrain
      useEditorStore.getState().pushExecutedCommand(
        createPaintTerrainCommand(
          this.paintStartTerrain,
          next.map((c) => ({ ...c })),
          this.mutators(),
          useEditorStore.getState().terrainTypeId,
        ),
      )
    }

    if (this.draggingObject && this.dragStart && useEditorStore.getState().selectedObjectId) {
      const id = useEditorStore.getState().selectedObjectId!
      const obj = useGardenStore.getState().getObject(id)
      if (
        obj &&
        (obj.x !== this.dragStart.objX || obj.y !== this.dragStart.objY)
      ) {
        // Move already applied live; push undo command without re-executing
        useGardenStore.getState().updateObject(id, {
          x: this.dragStart.objX,
          y: this.dragStart.objY,
        })
        useEditorStore.getState().executeCommand(
          createMoveObjectCommand(
            id,
            { x: this.dragStart.objX, y: this.dragStart.objY },
            { x: obj.x, y: obj.y },
            this.mutators(),
          ),
        )
      }
    }

    this.panning = false
    this.painting = false
    this.paintStartTerrain = null
    this.lastPaintCell = null
    this.draggingObject = false
    this.dragStart = null
  }

  private onWheel(event: WheelEvent): void {
    const camera = useGardenStore.getState().camera
    const worldBefore = screenToWorld(event.offsetX, event.offsetY, camera)
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const nextZoom = Math.min(
      theme.world.maxZoom,
      Math.max(theme.world.minZoom, camera.zoom * zoomFactor),
    )
    const next = clampCamera(
      {
        x: worldBefore.x - event.offsetX / nextZoom,
        y: worldBefore.y - event.offsetY / nextZoom,
        zoom: nextZoom,
      },
      this.viewport.width,
      this.viewport.height,
    )
    useGardenStore.getState().setCamera(next)
    this.applyCamera()
  }

  private paintAt(worldX: number, worldY: number): void {
    const editor = useEditorStore.getState()
    const cells = getBrushCells(
      worldX,
      worldY,
      editor.brushSize,
      editor.brushShape,
      this.lastPaintCell,
    )
    this.lastPaintCell = worldToCell(worldX, worldY)
    if (cells.length === 0) return
    const { next } = applyTerrainPaint(
      useGardenStore.getState().terrain,
      cells,
      editor.terrainTypeId,
    )
    useGardenStore.getState().replaceTerrain(next)
    this.updateBrushPreview(worldX, worldY)
  }

  private placeObject(assetId: string, x: number, y: number): void {
    const asset = assetsById.get(assetId)
    if (!asset) return
    const object: PlacedGardenObject = {
      instanceId: createId('obj'),
      assetId,
      x: Math.min(theme.world.width - 10, Math.max(10, x)),
      y: Math.min(theme.world.height - 10, Math.max(10, y)),
      rotation: 0,
      scale: asset.defaultScale,
      flipX: false,
      sortOffset: asset.sortOffset,
    }
    useEditorStore
      .getState()
      .executeCommand(createPlaceObjectCommand(object, this.mutators()))
    audioManager.play('place')
  }

  private updateGhost(x?: number, y?: number): void {
    const editor = useEditorStore.getState()
    const show =
      editor.tool === 'place' &&
      Boolean(editor.selectedAssetId) &&
      !editor.observeMode &&
      !editor.snapshotMode
    const px = x ?? this.getWorldPoint(this.lastPointer.x, this.lastPointer.y).x
    const py = y ?? this.getWorldPoint(this.lastPointer.x, this.lastPointer.y).y
    this.objectRenderer.setGhost(editor.selectedAssetId, px, py, show)
  }

  private updateBrushPreview(x: number, y: number): void {
    const editor = useEditorStore.getState()
    this.brushPreview.clear()
    if (editor.tool !== 'terrain' || editor.observeMode || editor.snapshotMode) return
    const radius = editor.brushSize * theme.world.tileSize
    this.brushPreview.circle(x, y, radius)
    this.brushPreview.stroke({ color: '#B66D4F', alpha: 0.55, width: 2 })
    this.brushPreview.fill({ color: '#B66D4F', alpha: 0.08 })
  }

  private onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }

    const editor = useEditorStore.getState()
    const mod = event.metaKey || event.ctrlKey

    if (event.code === 'Space') {
      this.spaceDown = true
      event.preventDefault()
    }

    if (event.key === 'Escape') {
      if (editor.tool === 'place') useEditorStore.getState().setTool('select')
      else useEditorStore.getState().setSelectedObjectId(null)
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      useEditorStore.getState().setObserveMode(!editor.observeMode)
    }

    if (!mod && !event.altKey) {
      const seasonByKey: Record<string, Season> = {
        '1': 'spring',
        '2': 'summer',
        '3': 'autumn',
        '4': 'winter',
      }
      const season = seasonByKey[event.key]
      if (season) {
        event.preventDefault()
        useGardenStore.getState().setSeason(season)
        if (season === 'winter' && useGardenStore.getState().weather === 'clear') {
          useGardenStore.getState().setWeather('snow')
        }
      }
    }

    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        useEditorStore.getState().redo()
      } else {
        useEditorStore.getState().undo()
      }
      audioManager.play('undo')
    }

    if (mod && event.key.toLowerCase() === 's') {
      event.preventDefault()
      useEditorStore.getState().setDialog('save')
    }

    if (mod && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      this.duplicateSelected()
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelected()
    }

    if (event.key.toLowerCase() === 'q') this.rotateSelected(-15)
    if (event.key.toLowerCase() === 'e') this.rotateSelected(15)
    if (event.key.toLowerCase() === 'x') this.flipSelected()
    if (event.key === '[') this.nudgeLayer(-8)
    if (event.key === ']') this.nudgeLayer(8)
    if (event.key === '=' || event.key === '+') this.scaleSelected(0.05)
    if (event.key === '-' || event.key === '_') this.scaleSelected(-0.05)
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') this.spaceDown = false
  }

  private transformSelected(
    patch: Partial<PlacedGardenObject>,
    label: string,
  ): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id || useEditorStore.getState().observeMode) return
    const obj = useGardenStore.getState().getObject(id)
    if (!obj) return

    const from: Partial<PlacedGardenObject> = {}
    const to: Partial<PlacedGardenObject> = {}
    for (const key of Object.keys(patch) as Array<keyof PlacedGardenObject>) {
      from[key] = obj[key] as never
      to[key] = patch[key] as never
    }

    const now = Date.now()
    if (
      this.pendingTransform &&
      this.pendingTransform.instanceId === id &&
      now - this.lastTransformAt < theme.editor.transformMergeMs
    ) {
      this.pendingTransform.applyTo(to)
      useGardenStore.getState().updateObject(id, to)
      this.lastTransformAt = now
      return
    }

    const mutableFrom = { ...from }
    const mutableTo = { ...to }
    const command = createTransformObjectCommand(
      id,
      mutableFrom,
      mutableTo,
      this.mutators(),
      label,
    )
    useEditorStore.getState().executeCommand(command)
    this.pendingTransform = {
      instanceId: id,
      applyTo: (nextPatch) => {
        const current = useGardenStore.getState().getObject(id)
        if (current) {
          for (const key of Object.keys(nextPatch) as Array<
            keyof PlacedGardenObject
          >) {
            if (!(key in mutableFrom)) {
              mutableFrom[key] = current[key] as never
            }
          }
        }
        Object.assign(mutableTo, nextPatch)
      },
    }
    this.lastTransformAt = now
  }

  rotateSelected(delta: number): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id) return
    const obj = useGardenStore.getState().getObject(id)
    const asset = obj ? assetsById.get(obj.assetId) : null
    if (!obj || !asset?.canRotate) return
    const rotation = ((obj.rotation + delta) % 360 + 360) % 360
    this.transformSelected({ rotation }, 'Rotate object')
  }

  flipSelected(): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id) return
    const obj = useGardenStore.getState().getObject(id)
    const asset = obj ? assetsById.get(obj.assetId) : null
    if (!obj || !asset?.canFlip) return
    this.transformSelected({ flipX: !obj.flipX }, 'Flip object')
  }

  scaleSelected(delta: number): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id) return
    const obj = useGardenStore.getState().getObject(id)
    const asset = obj ? assetsById.get(obj.assetId) : null
    if (!obj || !asset) return
    const scale = Math.min(
      asset.maxScale,
      Math.max(asset.minScale, Math.round((obj.scale + delta) * 20) / 20),
    )
    this.transformSelected({ scale }, 'Scale object')
  }

  nudgeLayer(delta: number): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id) return
    const obj = useGardenStore.getState().getObject(id)
    if (!obj) return
    this.transformSelected({ sortOffset: obj.sortOffset + delta }, 'Layer object')
  }

  deleteSelected(): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id || useEditorStore.getState().observeMode) return
    const obj = useGardenStore.getState().getObject(id)
    if (!obj) return
    useEditorStore
      .getState()
      .executeCommand(createDeleteObjectCommand(obj, this.mutators()))
    useEditorStore.getState().setSelectedObjectId(null)
    audioManager.play('delete')
  }

  duplicateSelected(): void {
    const id = useEditorStore.getState().selectedObjectId
    if (!id || useEditorStore.getState().observeMode) return
    const obj = useGardenStore.getState().getObject(id)
    if (!obj) return
    const clone: PlacedGardenObject = {
      ...obj,
      instanceId: createId('obj'),
      x: obj.x + 24,
      y: obj.y + 16,
    }
    useEditorStore
      .getState()
      .executeCommand(createPlaceObjectCommand(clone, this.mutators()))
    useEditorStore.getState().setSelectedObjectId(clone.instanceId)
    audioManager.play('place')
  }

  clearGarden(): void {
    const garden = useGardenStore.getState()
    useEditorStore.getState().executeCommand(
      createClearGardenCommand(
        garden.objects.map((o) => ({ ...o })),
        garden.terrain.map((c) => ({ ...c })),
        createEmptyTerrain('grass'),
        this.mutators(),
      ),
    )
    useEditorStore.getState().setSelectedObjectId(null)
  }

  async exportPng(): Promise<void> {
    if (!this.app) return
    const editor = useEditorStore.getState()
    useEditorStore.getState().setSnapshotMode(true)
    useEditorStore.getState().setSelectedObjectId(null)
    this.syncFromStores()
    this.brushPreview.clear()
    this.objectRenderer.setGhost(null, 0, 0, false)

    await new Promise((r) => requestAnimationFrame(() => r(null)))

    const url = await this.app.renderer.extract.base64({
      target: this.app.stage,
      format: 'png',
    })

    const link = document.createElement('a')
    link.download = `${useGardenStore.getState().name.replace(/\s+/g, '-').toLowerCase() || 'stillgarden'}.png`
    link.href = url
    link.click()

    useEditorStore.getState().setSnapshotMode(false)
    useEditorStore.getState().setObserveMode(editor.observeMode)
    audioManager.play('snapshot')
  }

  async captureThumbnail(): Promise<string | undefined> {
    if (!this.app) return undefined
    useEditorStore.getState().setSelectedObjectId(null)
    this.brushPreview.clear()
    this.objectRenderer.setGhost(null, 0, 0, false)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    return this.app.renderer.extract.base64({
      target: this.app.stage,
      format: 'png',
    })
  }

  destroy(): void {
    this.destroyed = true
    window.removeEventListener('keydown', this.boundKeyDown)
    window.removeEventListener('keyup', this.boundKeyUp)
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers = []
    this.terrainRenderer.destroy()
    this.objectRenderer.destroy()
    this.wildlife.destroy()
    this.weather.destroy()
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
    if (this.host) this.host.replaceChildren()
  }
}
