import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

export function OnboardingDialog() {
  const dialog = useEditorStore((s) => s.dialog)
  const setDialog = useEditorStore((s) => s.setDialog)
  const clearHistory = useEditorStore((s) => s.clearHistory)
  const newGarden = useGardenStore((s) => s.newGarden)

  if (dialog !== 'onboarding' && dialog !== 'new') return null

  const start = (mode: 'empty' | 'surprise') => {
    newGarden(mode, mode === 'surprise' ? 'Surprise Garden' : 'Untitled Garden')
    clearHistory()
    setDialog(null)
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <span className="hint-kicker">Stillgarden</span>
        <h3>{dialog === 'new' ? 'Start a new garden' : 'Paint a quiet garden'}</h3>
        <p>
          Place plants and structures, paint meadow paths and ponds, then step into
          Observe Mode. Everything autosaves locally — no account needed.
        </p>
        <div className="dialog-actions" style={{ justifyContent: 'stretch' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => start('empty')}>
            Empty Garden
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => start('surprise')}>
            Surprise Me
          </button>
        </div>
        {dialog === 'new' && (
          <div className="dialog-actions">
            <button className="btn" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
