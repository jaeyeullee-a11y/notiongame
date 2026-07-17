import { useEffect, useState } from 'react'
import { audioManager } from '@/systems/ambience/audio'
import {
  listSaveSlots,
  loadSlot,
  saveSlot,
  type SaveSlotSummary,
} from '@/systems/save/repository'
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

  useEffect(() => {
    if (dialog !== 'save' || !user) return
    void listSaveSlots()
      .then(setSlots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '세이브 목록을 불러오지 못했습니다.')
      })
  }, [dialog, user])

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
                  disabled={busy}
                  onClick={() => void onSave(slot.slot)}
                >
                  Save
                </button>
                <button
                  className="btn"
                  disabled={busy || slot.empty}
                  onClick={() => void onLoad(slot.slot)}
                >
                  Load
                </button>
              </div>
            </div>
          ))}
        </div>
        {error && <p style={{ color: '#9b4a3c', marginTop: 12 }}>{error}</p>}
        <div className="dialog-actions">
          <button className="btn" onClick={() => setDialog(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
