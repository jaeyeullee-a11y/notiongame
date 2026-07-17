import { useCallback, useState } from 'react'
import { GardenCanvas } from '@/components/GardenCanvas'
import { OnboardingDialog } from '@/components/dialogs/OnboardingDialog'
import { SaveDialog } from '@/components/dialogs/SaveDialog'
import { SettingsDialog } from '@/components/dialogs/SettingsDialog'
import { TopBar } from '@/components/layout/TopBar'
import { AssetLibrary } from '@/components/panels/AssetLibrary'
import { BottomToolbar } from '@/components/toolbar/BottomToolbar'
import { SelectionToolbar } from '@/components/toolbar/SelectionToolbar'
import type { GardenApplication } from '@/game/GardenApplication'
import { useAutosave } from '@/hooks/useAutosave'
import { useEditorStore } from '@/stores/editorStore'

export default function App() {
  const [gardenApp, setGardenApp] = useState<GardenApplication | null>(null)
  const observeMode = useEditorStore((s) => s.observeMode)
  const observeUiHidden = useEditorStore((s) => s.observeUiHidden)
  const assetPanelCollapsed = useEditorStore((s) => s.assetPanelCollapsed)
  const snapshotMode = useEditorStore((s) => s.snapshotMode)

  const onReady = useCallback((app: GardenApplication) => {
    setGardenApp(app)
  }, [])

  useAutosave(gardenApp)

  const hideChrome = (observeMode && observeUiHidden) || snapshotMode

  return (
    <div className={`app-shell ${hideChrome ? 'observe-hidden' : ''}`}>
      <TopBar gardenApp={gardenApp} />
      <div className={`workspace ${assetPanelCollapsed ? 'collapsed' : ''}`}>
        <AssetLibrary />
        <div className="canvas-pane">
          <GardenCanvas onReady={onReady} />
          <SelectionToolbar gardenApp={gardenApp} />
        </div>
      </div>
      <BottomToolbar />
      <OnboardingDialog />
      <SaveDialog gardenApp={gardenApp} />
      <SettingsDialog gardenApp={gardenApp} />
    </div>
  )
}
