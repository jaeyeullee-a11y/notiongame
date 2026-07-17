import { audioManager } from '@/systems/ambience/audio'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

type Props = {
  gardenApp: GardenApplication | null
}

export function SettingsDialog({ gardenApp }: Props) {
  const dialog = useEditorStore((s) => s.dialog)
  const setDialog = useEditorStore((s) => s.setDialog)
  const settings = useGardenStore((s) => s.settings)
  const setSettings = useGardenStore((s) => s.setSettings)

  if (dialog !== 'settings') return null

  const update = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch }
    setSettings(patch)
    audioManager.unlock()
    audioManager.applySettings(next)
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h3>Settings</h3>
        <div className="settings-grid">
          <label className="settings-row">
            <span>Music</span>
            <input
              type="checkbox"
              checked={settings.musicEnabled}
              onChange={(e) => update({ musicEnabled: e.target.checked })}
            />
          </label>
          <label className="settings-row">
            <span>Music volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) => update({ musicVolume: Number(e.target.value) })}
            />
          </label>
          <label className="settings-row">
            <span>Ambience</span>
            <input
              type="checkbox"
              checked={settings.ambienceEnabled}
              onChange={(e) => update({ ambienceEnabled: e.target.checked })}
            />
          </label>
          <label className="settings-row">
            <span>Ambience volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.ambienceVolume}
              onChange={(e) => update({ ambienceVolume: Number(e.target.value) })}
            />
          </label>
          <div className="settings-row">
            <span>Clear garden</span>
            <button
              className="btn"
              onClick={() => {
                gardenApp?.clearGarden()
                setDialog(null)
              }}
            >
              Clear all
            </button>
          </div>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={() => setDialog(null)}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
