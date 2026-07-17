import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'

type Mode = 'login' | 'signup'

export function AuthDialog() {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const login = useAuthStore((s) => s.login)
  const signup = useAuthStore((s) => s.signup)
  const setDialog = useEditorStore((s) => s.setDialog)

  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!hydrated || user) return null

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signup') {
        await signup(username)
        setDialog('onboarding')
      } else {
        await login(username)
        // App restores this account's saves (or opens onboarding).
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '계정 처리에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog auth-dialog">
        <span className="hint-kicker">Stillgarden</span>
        <h3>{mode === 'login' ? '로그인' : '회원가입'}</h3>
        <p>
          {mode === 'login'
            ? '아이디로 로그인하면 내 정원 세이브를 불러옵니다.'
            : '아이디만 입력하면 바로 가입됩니다. (최소 3글자)'}
        </p>
        <label className="auth-field">
          <span>아이디</span>
          <input
            className="search-input"
            value={username}
            autoFocus
            autoComplete="username"
            placeholder="예: gardenfox"
            maxLength={24}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !busy) void submit()
            }}
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="dialog-actions" style={{ justifyContent: 'stretch' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={busy || username.trim().length === 0}
            onClick={() => void submit()}
          >
            {busy ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>
        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              계정이 없나요?{' '}
              <button
                className="link-btn"
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있나요?{' '}
              <button
                className="link-btn"
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                }}
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
