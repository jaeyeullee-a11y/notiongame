import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

type Props = {
  gardenApp: GardenApplication | null
}

export function TopBar({ gardenApp }: Props) {
  const name = useGardenStore((s) => s.name)
  const setName = useGardenStore((s) => s.setName)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const observeMode = useEditorStore((s) => s.observeMode)
  const setObserveMode = useEditorStore((s) => s.setObserveMode)
  const setDialog = useEditorStore((s) => s.setDialog)

  return (
    <header className="top-bar">
      <div className="brand">Stillgarden</div>
      <input
        className="garden-name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Garden name"
      />
      <div className="top-actions">
        <button className="btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className="btn" disabled={!canRedo} onClick={redo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        <button className="btn" onClick={() => setDialog('save')}>
          Save
        </button>
        <button
          className={`btn ${observeMode ? 'active' : ''}`}
          onClick={() => setObserveMode(!observeMode)}
          title="Toggle Observe Mode (Tab)"
        >
          {observeMode ? 'Edit' : 'Observe'}
        </button>
        <button className="btn" onClick={() => setDialog('settings')}>
          Settings
        </button>
        <button className="btn" onClick={() => setDialog('new')}>
          New
        </button>
        <button
          className="btn btn-primary"
          onClick={() => void gardenApp?.exportPng()}
          title="Export PNG snapshot"
        >
          Snapshot
        </button>
      </div>
    </header>
  )
}
