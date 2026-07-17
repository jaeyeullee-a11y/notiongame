import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'
import type { Season, WeatherType } from '@/schemas/garden'

type Props = {
  gardenApp: GardenApplication | null
}

const SEASONS: Array<{ value: Season; label: string; emoji: string; hotkey: string }> = [
  { value: 'spring', label: '봄', emoji: '🌸', hotkey: '1' },
  { value: 'summer', label: '여름', emoji: '☀️', hotkey: '2' },
  { value: 'autumn', label: '가을', emoji: '🍂', hotkey: '3' },
  { value: 'winter', label: '겨울', emoji: '❄️', hotkey: '4' },
]

const WEATHERS: Array<{ value: WeatherType; label: string; emoji: string }> = [
  { value: 'clear', label: '맑음', emoji: '☀️' },
  { value: 'rain', label: '비', emoji: '🌧️' },
  { value: 'snow', label: '눈', emoji: '🌨️' },
]

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
  const season = useGardenStore((s) => s.season)
  const weather = useGardenStore((s) => s.weather)
  const setSeason = useGardenStore((s) => s.setSeason)
  const setWeather = useGardenStore((s) => s.setWeather)

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
        <div className="season-controls" role="group" aria-label="계절 선택">
          {SEASONS.map((option) => (
            <button
              key={option.value}
              className={`btn season-btn ${season === option.value ? 'active' : ''}`}
              disabled={!user}
              aria-pressed={season === option.value}
              aria-label={`${option.label} 계절 선택`}
              title={`${option.label} (${option.hotkey})`}
              onClick={() => setSeason(option.value)}
            >
              <span aria-hidden>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <label className="weather-select-wrap">
          <span className="sr-only">날씨 선택</span>
          <select
            className="weather-select"
            value={weather}
            onChange={(e) => setWeather(e.target.value as WeatherType)}
            disabled={!user}
            aria-label="날씨 선택"
          >
            {WEATHERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </label>
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
