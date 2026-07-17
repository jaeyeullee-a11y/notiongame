import { ASSET_CATEGORIES, searchAssets } from '@/lib/assets'
import { useEditorStore } from '@/stores/editorStore'
import type { AssetCategory } from '@/schemas/garden'

export function AssetLibrary() {
  const collapsed = useEditorStore((s) => s.assetPanelCollapsed)
  const setCollapsed = useEditorStore((s) => s.setAssetPanelCollapsed)
  const category = useEditorStore((s) => s.assetCategory)
  const setCategory = useEditorStore((s) => s.setAssetCategory)
  const search = useEditorStore((s) => s.assetSearch)
  const setSearch = useEditorStore((s) => s.setAssetSearch)
  const selectedAssetId = useEditorStore((s) => s.selectedAssetId)
  const setSelectedAssetId = useEditorStore((s) => s.setSelectedAssetId)

  const assets = searchAssets(search).filter(
    (asset) => category === 'all' || asset.category === category,
  )

  return (
    <aside className={`asset-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        {!collapsed && <h2>Library</h2>}
        <button
          className="btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand library' : 'Collapse library'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>
      <div className="panel-body">
        <input
          className="search-input"
          placeholder="Search plants & structures"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="category-tabs">
          <button
            className={`chip ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {ASSET_CATEGORIES.map((item) => (
            <button
              key={item.id}
              className={`chip ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id as AssetCategory)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="asset-grid">
          {assets.map((asset) => (
            <button
              key={asset.id}
              className={`asset-card ${selectedAssetId === asset.id ? 'active' : ''}`}
              onClick={() => setSelectedAssetId(asset.id)}
              title={asset.displayName}
            >
              <img src={asset.thumbnailUrl} alt="" />
              <span>{asset.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
