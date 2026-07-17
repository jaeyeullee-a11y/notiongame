import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

type Props = {
  gardenApp: GardenApplication | null
}

export function TopBar({ gardenApp }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const name = useGardenStore((s) => s.name)
  const setName = useGardenStore((s) => s.setName)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const observeMode = useEditorStore((s) => s.observeMode)
  const setObserveMode = useEditorStore((s) => s.setObserveMode)
  const setDialog = useEditorStore((s) => s.setDialog)
  const clearHistory = useEditorStore((s) => s.clearHistory)

  const onLogout = () => {
    logout()
    clearHistory()
    setDialog(null)
  }

  return (
    <header className="top-bar">
      <div className="brand">Stillgarden</div>
      {user && (
        <span className="user-chip" title="현재 계정">
          {user.username}
        </span>
      )}
      <input
        className="garden-name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Garden name"
        disabled={!user}
      />
      <div className="top-actions">
        <button className="btn" disabled={!canUndo || !user} onClick={undo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className="btn" disabled={!canRedo || !user} onClick={redo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        <button className="btn" disabled={!user} onClick={() => setDialog('save')}>
          Save
        </button>
        <button
          className={`btn ${observeMode ? 'active' : ''}`}
          disabled={!user}
          onClick={() => setObserveMode(!observeMode)}
          title="Toggle Observe Mode (Tab)"
        >
          {observeMode ? 'Edit' : 'Observe'}
        </button>
        <button className="btn" disabled={!user} onClick={() => setDialog('settings')}>
          Settings
        </button>
        <button className="btn" disabled={!user} onClick={() => setDialog('new')}>
          New
        </button>
        <button
          className="btn btn-primary"
          disabled={!user}
          onClick={() => void gardenApp?.exportPng()}
          title="Export PNG snapshot"
        >
          Snapshot
        </button>
        {user && (
          <button className="btn" onClick={onLogout} title="로그아웃">
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
