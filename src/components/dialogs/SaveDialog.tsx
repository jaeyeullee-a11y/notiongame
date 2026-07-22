import { useEffect, useState } from 'react'
import { audioManager } from '@/systems/ambience/audio'
import { isCloudAuthEnabled } from '@/systems/auth/api'
import { publishToGallery } from '@/systems/gallery/api'
import {
  listSaveSlots,
  loadSlot,
  saveSlot,
  type SaveSlotSummary,
} from '@/systems/save/repository'
import { useShareGarden } from '@/hooks/useShareGarden'
import { useAuthStore } from '@/stores/authStore'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

type Props = {
  gardenApp: GardenApplication | null
}

export function SaveDialog({ gardenApp }: Props) {
  const user = useAuthStore((s) => s.user)
  const dialog = useEditorStore((s) => s.dialog)
  const setDialog = useEditorStore((s) => s.setDialog)
  const clearHistory = useEditorStore((s) => s.clearHistory)
  const hydrateFromSave = useGardenStore((s) => s.hydrateFromSave)
  const toSaveData = useGardenStore((s) => s.toSaveData)
  const markClean = useGardenStore((s) => s.markClean)
  const activeSlot = useGardenStore((s) => s.activeSlot)
  const [slots, setSlots] = useState<SaveSlotSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cloudEnabled, setCloudEnabled] = useState(false)
  const [publishToGalleryChecked, setPublishToGalleryChecked] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const { isSharing, createShare, copyToClipboard, error: shareError } =
    useShareGarden()

  useEffect(() => {
    if (dialog !== 'save' || !user) return
    void listSaveSlots()
      .then(setSlots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '세이브 목록을 불러오지 못했습니다.')
      })
    void isCloudAuthEnabled().then(setCloudEnabled)
  }, [dialog, user])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (dialog !== 'save' || !user) return null

  const refresh = async () => setSlots(await listSaveSlots())

  const onSave = async (slot: number) => {
    setBusy(true)
    setError(null)
    try {
      const thumbnail = await gardenApp?.captureThumbnail()
      await saveSlot(slot, toSaveData(), thumbnail)
      useGardenStore.setState({ activeSlot: slot })
      markClean()
      audioManager.play('save')
      await refresh()
      setDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save garden.')
    } finally {
      setBusy(false)
    }
  }

  const onLoad = async (slot: number) => {
    setBusy(true)
    setError(null)
    try {
      const data = await loadSlot(slot)
      if (!data) {
        setError('That slot is empty.')
        return
      }
      hydrateFromSave(data, slot)
      clearHistory()
      setDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load garden.')
    } finally {
      setBusy(false)
    }
  }

  const onShare = async (slot: number) => {
    if (!cloudEnabled) {
      setError('클라우드가 켜진 환경에서만 공유 링크를 만들 수 있습니다.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const data = await loadSlot(slot)
      if (!data) {
        setError('빈 슬롯은 공유할 수 없습니다.')
        return
      }
      const thumbnail =
        slots.find((item) => item.slot === slot)?.thumbnailDataUrl ??
        (await gardenApp?.captureThumbnail())
      const share = await createShare(data, thumbnail)
      if (!share) return

      if (publishToGalleryChecked) {
        await publishToGallery({
          shareId: share.shareId,
          username: user.username,
          gardenName: data.name,
          thumbnailDataUrl: thumbnail,
          isPublic: true,
        })
      }

      const copied = await copyToClipboard(share.shareUrl)
      setToast(
        copied
          ? publishToGalleryChecked
            ? '링크 복사됨 · 갤러리에 공개됨'
            : '링크 복사됨'
          : publishToGalleryChecked
            ? '공유 링크가 생성되었고 갤러리에 공개되었습니다'
            : '공유 링크가 생성되었습니다',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '공유 링크를 만들지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h3>Save & Load</h3>
        <p>
          <strong>{user.username}</strong> 계정의 슬롯 6개입니다. 자동저장은 활성
          슬롯에 잠시 후 기록됩니다.
        </p>
        <div className="save-slots">
          {slots.map((slot) => (
            <div key={slot.slot} className="save-slot">
              {slot.thumbnailDataUrl ? (
                <img src={slot.thumbnailDataUrl} alt="" />
              ) : (
                <div className="thumb-empty" />
              )}
              <div className="meta">
                <strong>
                  Slot {slot.slot}
                  {activeSlot === slot.slot ? ' · Active' : ''}
                </strong>
                <span>
                  {slot.empty
                    ? 'Empty'
                    : `${slot.name} · ${slot.objectCount ?? 0} objects`}
                </span>
                {!slot.empty && slot.updatedAt && (
                  <span>{new Date(slot.updatedAt).toLocaleString()}</span>
                )}
              </div>
              <div className="tool-group">
                <button
                  className="btn btn-primary"
                  disabled={busy || isSharing}
                  onClick={() => void onSave(slot.slot)}
                >
                  Save
                </button>
                <button
                  className="btn"
                  disabled={busy || isSharing || slot.empty}
                  onClick={() => void onLoad(slot.slot)}
                >
                  Load
                </button>
                <button
                  className="btn"
                  disabled={busy || isSharing || slot.empty || !cloudEnabled}
                  onClick={() => void onShare(slot.slot)}
                  aria-label="공유 링크 생성"
                  title={
                    cloudEnabled
                      ? '공유 링크 생성'
                      : '클라우드 환경에서만 공유할 수 있습니다'
                  }
                >
                  {isSharing ? '…' : 'Share'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {cloudEnabled ? (
          <label className="share-publish-option">
            <input
              type="checkbox"
              checked={publishToGalleryChecked}
              onChange={(event) =>
                setPublishToGalleryChecked(event.target.checked)
              }
            />
            <span>갤러리에 공개</span>
          </label>
        ) : (
          <p className="share-hint">
            로컬 전용 모드에서는 공유 링크와 갤러리 공개를 사용할 수 없습니다.
            Netlify에 배포된 환경에서 이용해 주세요.
          </p>
        )}
        {(error || shareError) && (
          <p style={{ color: '#9b4a3c', marginTop: 12 }}>{error ?? shareError}</p>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        <div className="dialog-actions">
          <button className="btn" onClick={() => setDialog(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
