import { useCallback, useEffect, useRef, useState } from 'react'
import { GardenCanvas } from '@/components/GardenCanvas'
import { AuthDialog } from '@/components/dialogs/AuthDialog'
import { ExportDialog } from '@/components/dialogs/ExportDialog'
import { OnboardingDialog } from '@/components/dialogs/OnboardingDialog'
import { SaveDialog } from '@/components/dialogs/SaveDialog'
import { SettingsDialog } from '@/components/dialogs/SettingsDialog'
import { TopBar } from '@/components/layout/TopBar'
import { AssetLibrary } from '@/components/panels/AssetLibrary'
import { BottomToolbar } from '@/components/toolbar/BottomToolbar'
import { SelectionToolbar } from '@/components/toolbar/SelectionToolbar'
import type { GardenApplication } from '@/game/GardenApplication'
import { useAutosave } from '@/hooks/useAutosave'
import { purgeLegacyDatabase } from '@/systems/save/db'
import { listSaveSlots, loadSlot } from '@/systems/save/repository'
import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

export default function EditorApp() {
  const [gardenApp, setGardenApp] = useState<GardenApplication | null>(null)
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrateSession = useAuthStore((s) => s.hydrateSession)
  const observeMode = useEditorStore((s) => s.observeMode)
  const observeUiHidden = useEditorStore((s) => s.observeUiHidden)
  const assetPanelCollapsed = useEditorStore((s) => s.assetPanelCollapsed)
  const snapshotMode = useEditorStore((s) => s.snapshotMode)
  const setDialog = useEditorStore((s) => s.setDialog)
  const clearHistory = useEditorStore((s) => s.clearHistory)
  const hydrateFromSave = useGardenStore((s) => s.hydrateFromSave)
  const restoredForUser = useRef<string | null>(null)

  useEffect(() => {
    void purgeLegacyDatabase().finally(() => {
      hydrateSession()
    })
  }, [hydrateSession])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      restoredForUser.current = null
      setDialog(null)
      return
    }
    if (restoredForUser.current === user.username) return
    restoredForUser.current = user.username

    void (async () => {
      try {
        const slots = await listSaveSlots()
        const firstFilled = slots.find((slot) => !slot.empty)
        if (firstFilled) {
          const data = await loadSlot(firstFilled.slot)
          if (data) {
            hydrateFromSave(data, firstFilled.slot)
            clearHistory()
            setDialog(null)
            return
          }
        }
        setDialog('onboarding')
      } catch {
        setDialog('onboarding')
      }
    })()
  }, [hydrated, user, setDialog, hydrateFromSave, clearHistory])

  const onReady = useCallback((app: GardenApplication) => {
    setGardenApp(app)
  }, [])

  useAutosave(gardenApp)

  const hideChrome = (observeMode && observeUiHidden) || snapshotMode

  return (
    <div className={`app-shell ${hideChrome ? 'observe-hidden' : ''}`}>
      <TopBar />
      <div className={`workspace ${assetPanelCollapsed ? 'collapsed' : ''}`}>
        <AssetLibrary />
        <div className="canvas-pane">
          {user ? (
            <GardenCanvas onReady={onReady} />
          ) : (
            <div className="canvas-placeholder" />
          )}
          <SelectionToolbar gardenApp={gardenApp} />
        </div>
      </div>
      <BottomToolbar />
      <AuthDialog />
      <OnboardingDialog />
      <SaveDialog gardenApp={gardenApp} />
      <SettingsDialog gardenApp={gardenApp} />
      <ExportDialog gardenApp={gardenApp} />
    </div>
  )
}
