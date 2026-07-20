import { useEffect, useState } from 'react'
import { MOBILE_MAX_WIDTH_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'

const STORAGE_KEY = 'stillgarden.touch-hint-dismissed'

export function TouchHint() {
  const isMobile = useMediaQuery(MOBILE_MAX_WIDTH_QUERY)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      setVisible(false)
      return
    }
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setVisible(true)
    }
  }, [isMobile])

  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore quota / private mode
    }
    setVisible(false)
  }

  return (
    <div className="touch-hint" role="status">
      <p>두 손가락으로 줌 · 드래그로 이동</p>
      <button type="button" className="btn" onClick={dismiss}>
        확인
      </button>
    </div>
  )
}
