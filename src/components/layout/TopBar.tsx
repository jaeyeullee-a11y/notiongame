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
  const timeOfDay = useGardenStore((s) => s.settings.timeOfDay ?? 'day')
  const setSettings = useGardenStore((s) => s.setSettings)

  const toggleTimeOfDay = () => {
    setSettings({ timeOfDay: timeOfDay === 'day' ? 'night' : 'day' })
  }

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
          className={`btn ${timeOfDay === 'night' ? 'active' : ''}`}
          disabled={!user}
          onClick={toggleTimeOfDay}
          aria-label="야간 모드 전환"
          aria-pressed={timeOfDay === 'night'}
          title="Toggle day/night (N)"
        >
          {timeOfDay === 'night' ? (
            <SunIcon />
          ) : (
            <MoonIcon />
          )}
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

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
