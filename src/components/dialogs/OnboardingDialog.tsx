import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

export function OnboardingDialog() {
  const user = useAuthStore((s) => s.user)
  const dialog = useEditorStore((s) => s.dialog)
  const setDialog = useEditorStore((s) => s.setDialog)
  const clearHistory = useEditorStore((s) => s.clearHistory)
  const newGarden = useGardenStore((s) => s.newGarden)

  if (!user) return null
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
        <h3>
          {dialog === 'new'
            ? '새 정원 시작'
            : `${user.username}님, 정원을 시작해 볼까요?`}
        </h3>
        <p>
          지형을 칠하고 식물을 배치한 뒤 Observe Mode로 여유를 즐겨 보세요.
          저장은 계정별로 보관됩니다.
        </p>
        <div className="dialog-actions" style={{ justifyContent: 'stretch' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => start('empty')}>
            Empty Garden
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => start('surprise')}
          >
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
