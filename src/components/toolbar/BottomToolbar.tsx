import terrainData from '@/data/terrain.json'
import { MOBILE_MAX_WIDTH_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useEditorStore } from '@/stores/editorStore'
import type { BrushShape, BrushSize, EditorTool, TerrainTypeId } from '@/schemas/garden'
import { useGardenStore } from '@/stores/gardenStore'

const TOOLS: Array<{ id: EditorTool; label: string }> = [
  { id: 'select', label: 'Select' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'erase', label: 'Erase' },
  { id: 'pan', label: 'Pan' },
]

export function BottomToolbar() {
  const isMobile = useMediaQuery(MOBILE_MAX_WIDTH_QUERY)
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const terrainTypeId = useEditorStore((s) => s.terrainTypeId)
  const setTerrainTypeId = useEditorStore((s) => s.setTerrainTypeId)
  const brushSize = useEditorStore((s) => s.brushSize)
  const setBrushSize = useEditorStore((s) => s.setBrushSize)
  const brushShape = useEditorStore((s) => s.brushShape)
  const setBrushShape = useEditorStore((s) => s.setBrushShape)
  const assetPanelCollapsed = useEditorStore((s) => s.assetPanelCollapsed)
  const setAssetPanelCollapsed = useEditorStore((s) => s.setAssetPanelCollapsed)
  const camera = useGardenStore((s) => s.camera)
  const setCamera = useGardenStore((s) => s.setCamera)
  const objectCount = useGardenStore((s) => s.objects.length)
  const selectedAssetId = useEditorStore((s) => s.selectedAssetId)

  return (
    <footer className="bottom-bar">
      <div className="tool-group">
        <button
          type="button"
          className={`tool-btn library-toggle-mobile ${!assetPanelCollapsed ? 'active' : ''}`}
          onClick={() => setAssetPanelCollapsed(!assetPanelCollapsed)}
          aria-expanded={!assetPanelCollapsed}
          title="Asset library"
        >
          {isMobile ? 'Library' : 'Lib'}
        </button>
        {TOOLS.map((item) => (
          <button
            key={item.id}
            className={`tool-btn ${tool === item.id || (item.id === 'select' && tool === 'place') ? 'active' : ''}`}
            onClick={() => setTool(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tool === 'terrain' && (
        <>
          <div className="tool-group">
            {terrainData.types.map((terrain) => (
              <button
                key={terrain.id}
                className={`tool-btn ${terrainTypeId === terrain.id ? 'active' : ''}`}
                onClick={() => setTerrainTypeId(terrain.id as TerrainTypeId)}
                title={terrain.displayName}
              >
                {terrain.displayName}
              </button>
            ))}
          </div>
          <div className="tool-group">
            {[1, 2, 4].map((size) => (
              <button
                key={size}
                className={`tool-btn ${brushSize === size ? 'active' : ''}`}
                onClick={() => setBrushSize(size as BrushSize)}
              >
                R{size}
              </button>
            ))}
            {(['round', 'path'] as BrushShape[]).map((shape) => (
              <button
                key={shape}
                className={`tool-btn ${brushShape === shape ? 'active' : ''}`}
                onClick={() => setBrushShape(shape)}
              >
                {shape}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="spacer" />

      <div className="tool-group">
        <button
          className="tool-btn"
          onClick={() => setCamera({ ...camera, zoom: Math.max(0.5, camera.zoom - 0.1) })}
        >
          −
        </button>
        <span className="status-text">{Math.round(camera.zoom * 100)}%</span>
        <button
          className="tool-btn"
          onClick={() => setCamera({ ...camera, zoom: Math.min(2, camera.zoom + 0.1) })}
        >
          +
        </button>
      </div>

      <span className="status-text">
        {tool === 'place' && selectedAssetId
          ? `Placing ${selectedAssetId}`
          : `${objectCount} objects`}
      </span>
    </footer>
  )
}
