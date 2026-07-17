import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { Season, WeatherType } from '@/schemas/garden'

const SEASONS: Array<{ id: Season; label: string }> = [
  { id: 'spring', label: '봄' },
  { id: 'summer', label: '여름' },
  { id: 'autumn', label: '가을' },
  { id: 'winter', label: '겨울' },
]

const WEATHER_OPTIONS: Array<{ id: WeatherType; label: string }> = [
  { id: 'clear', label: '맑음' },
  { id: 'rain', label: '비' },
  { id: 'snow', label: '눈' },
]

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const name = useGardenStore((s) => s.name)
  const setName = useGardenStore((s) => s.setName)
  const season = useGardenStore((s) => s.season)
  const weather = useGardenStore((s) => s.weather)
  const setSeason = useGardenStore((s) => s.setSeason)
  const setWeather = useGardenStore((s) => s.setWeather)
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

  const onSelectSeason = (next: Season) => {
    setSeason(next)
    if (next === 'winter' && weather === 'clear') {
      setWeather('snow')
    }
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
        <div className="season-weather-controls" role="group" aria-label="계절과 날씨">
          <div className="season-btn-group" role="group" aria-label="계절 선택">
            {SEASONS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`btn season-btn ${season === item.id ? 'active' : ''}`}
                disabled={!user}
                aria-label={`${item.label} 계절`}
                aria-pressed={season === item.id}
                title={`${item.label} (단축키 ${index + 1})`}
                onClick={() => onSelectSeason(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="weather-select-label">
            <span className="sr-only">날씨 선택</span>
            <select
              className="weather-select"
              value={weather}
              disabled={!user}
              aria-label="날씨 선택"
              onChange={(e) => setWeather(e.target.value as WeatherType)}
            >
              {WEATHER_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
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
          onClick={() => setDialog('export')}
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
