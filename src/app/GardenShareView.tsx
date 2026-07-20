import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GardenCanvas } from '@/components/GardenCanvas'
import { audioManager } from '@/systems/ambience/audio'
import { loadSharedGarden } from '@/systems/share/api'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

export function GardenShareView() {
  const { shareId = '' } = useParams<{ shareId: string }>()
  const hydrateFromSave = useGardenStore((s) => s.hydrateFromSave)
  const gardenName = useGardenStore((s) => s.name)
  const setObserveMode = useEditorStore((s) => s.setObserveMode)
  const setSelectedObjectId = useEditorStore((s) => s.setSelectedObjectId)
  const setStatusMessage = useEditorStore((s) => s.setStatusMessage)

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioOn, setAudioOn] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    setErrorMessage(null)
    setAudioOn(false)
    setObserveMode(true)
    setSelectedObjectId(null)
    setStatusMessage(null)

    void (async () => {
      try {
        const result = await loadSharedGarden(shareId)
        if (cancelled) return
        if (!result) {
          setLoadState('not-found')
          return
        }

        // Visitors start muted; they can opt into ambience.
        hydrateFromSave({
          ...result.garden,
          settings: {
            ...result.garden.settings,
            musicEnabled: false,
            ambienceEnabled: false,
          },
        })
        setObserveMode(true)
        setLoadState('ready')
      } catch (err) {
        if (cancelled) return
        setErrorMessage(
          err instanceof Error ? err.message : '공유 정원을 불러오지 못했습니다.',
        )
        setLoadState('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    shareId,
    hydrateFromSave,
    setObserveMode,
    setSelectedObjectId,
    setStatusMessage,
  ])

  // Keep the shared view locked in observe mode (Tab must not unlock editing).
  useEffect(() => {
    if (loadState !== 'ready') return
    setObserveMode(true)
    return useEditorStore.subscribe((state) => {
      if (!state.observeMode) setObserveMode(true)
    })
  }, [loadState, setObserveMode])

  const toggleAudio = () => {
    const next = !audioOn
    setAudioOn(next)
    audioManager.unlock()
    audioManager.applySettings({
      musicEnabled: next,
      ambienceEnabled: next,
      musicVolume: 0.45,
      ambienceVolume: 0.35,
    })
  }

  if (loadState === 'loading') {
    return (
      <div className="share-view share-view-status">
        <p>정원을 불러오는 중…</p>
      </div>
    )
  }

  if (loadState === 'not-found') {
    return (
      <div className="share-view share-view-status">
        <h1>정원을 찾을 수 없습니다</h1>
        <p>링크가 잘못되었거나 더 이상 사용할 수 없습니다.</p>
        <Link className="btn btn-primary" to="/">
          나만의 정원 만들기
        </Link>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="share-view share-view-status">
        <h1>정원을 열 수 없습니다</h1>
        <p>{errorMessage}</p>
        <Link className="btn btn-primary" to="/">
          나만의 정원 만들기
        </Link>
      </div>
    )
  }

  return (
    <div className="share-view">
      <header className="share-chrome">
        <div className="share-title">
          <span>{gardenName || 'Shared Garden'}</span>
        </div>
        <div className="share-actions">
          <button
            type="button"
            className="btn"
            onClick={toggleAudio}
            aria-label={audioOn ? '오디오 끄기' : '오디오 켜기'}
            aria-pressed={audioOn}
            title={audioOn ? 'Mute audio' : 'Unmute audio'}
          >
            <span aria-hidden="true">{audioOn ? 'On' : 'Off'}</span>
            <span className="share-audio-label">{audioOn ? '소리 켜짐' : '소리 꺼짐'}</span>
          </button>
          <Link className="btn btn-primary" to="/">
            나만의 정원 만들기
          </Link>
        </div>
      </header>
      <div className="share-canvas">
        <GardenCanvas onReady={() => undefined} />
      </div>
    </div>
  )
}
