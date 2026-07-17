import { useEffect, useId, useState } from 'react'
import type { GardenApplication } from '@/game/GardenApplication'
import {
  EXPORT_MULTIPLIERS,
  EXPORT_SIZE_HINTS,
  readStoredExportMultiplier,
  storeExportMultiplier,
  type ExportMultiplier,
} from '@/lib/exportPng'
import { useEditorStore } from '@/stores/editorStore'

type Props = {
  gardenApp: GardenApplication | null
}

export function ExportDialog({ gardenApp }: Props) {
  const dialog = useEditorStore((s) => s.dialog)
  const setDialog = useEditorStore((s) => s.setDialog)
  const titleId = useId()
  const [multiplier, setMultiplier] = useState<ExportMultiplier>(
    readStoredExportMultiplier,
  )
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dialog !== 'export') return
    setMultiplier(readStoredExportMultiplier())
    setError(null)
    setExporting(false)
  }, [dialog])

  useEffect(() => {
    if (dialog !== 'export') return

    const runExport = async () => {
      if (!gardenApp || exporting) return
      setExporting(true)
      setError(null)
      storeExportMultiplier(multiplier)
      try {
        await gardenApp.exportPng(multiplier)
        setDialog(null)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'PNG 내보내기에 실패했습니다. 더 낮은 해상도로 다시 시도해 주세요.',
        )
      } finally {
        setExporting(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!exporting) setDialog(null)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        void runExport()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialog, exporting, gardenApp, multiplier, setDialog])

  if (dialog !== 'export') return null

  const handleExport = async () => {
    if (!gardenApp || exporting) return
    setExporting(true)
    setError(null)
    storeExportMultiplier(multiplier)
    try {
      await gardenApp.exportPng(multiplier)
      setDialog(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'PNG 내보내기에 실패했습니다. 더 낮은 해상도로 다시 시도해 주세요.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId}>Snapshot 내보내기</h3>
        <p>해상도를 선택하세요:</p>
        <fieldset className="export-options" disabled={exporting}>
          <legend className="sr-only">해상도 배율</legend>
          {EXPORT_MULTIPLIERS.map((value) => {
            const hint = EXPORT_SIZE_HINTS[value]
            return (
              <label key={value} className="export-option">
                <input
                  type="radio"
                  name="export-multiplier"
                  value={value}
                  checked={multiplier === value}
                  onChange={() => setMultiplier(value)}
                />
                <span>
                  <strong>{hint.label}</strong>
                  <span className="export-option-hint"> ({hint.sizeHint})</span>
                </span>
              </label>
            )
          })}
        </fieldset>
        {exporting && (
          <p className="export-status" role="status" aria-live="polite">
            내보내는 중…
          </p>
        )}
        {error && <p className="export-error">{error}</p>}
        <div className="dialog-actions">
          <button
            type="button"
            className="btn"
            disabled={exporting}
            onClick={() => setDialog(null)}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={exporting || !gardenApp}
            onClick={() => void handleExport()}
          >
            {exporting ? '내보내는 중…' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}
