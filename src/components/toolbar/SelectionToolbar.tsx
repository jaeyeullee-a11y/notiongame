import { assetsById } from '@/lib/assets'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

type Props = {
  gardenApp: GardenApplication | null
}

export function SelectionToolbar({ gardenApp }: Props) {
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const observeMode = useEditorStore((s) => s.observeMode)
  const object = useGardenStore((s) =>
    selectedObjectId ? s.objects.find((o) => o.instanceId === selectedObjectId) : null,
  )

  if (!selectedObjectId || !object || observeMode || !gardenApp) return null

  const asset = assetsById.get(object.assetId)

  return (
    <div className="selection-toolbar">
      <button
        className="btn"
        onClick={() => gardenApp.rotateSelected(-15)}
        disabled={!asset?.canRotate}
      >
        Rotate L
      </button>
      <button
        className="btn"
        onClick={() => gardenApp.rotateSelected(15)}
        disabled={!asset?.canRotate}
      >
        Rotate R
      </button>
      <button
        className="btn"
        onClick={() => gardenApp.flipSelected()}
        disabled={!asset?.canFlip}
      >
        Flip
      </button>
      <button className="btn" onClick={() => gardenApp.scaleSelected(-0.05)}>
        Smaller
      </button>
      <button className="btn" onClick={() => gardenApp.scaleSelected(0.05)}>
        Larger
      </button>
      <button className="btn" onClick={() => gardenApp.nudgeLayer(-8)}>
        Back
      </button>
      <button className="btn" onClick={() => gardenApp.nudgeLayer(8)}>
        Forward
      </button>
      <button className="btn" onClick={() => gardenApp.duplicateSelected()}>
        Duplicate
      </button>
      <button className="btn" onClick={() => gardenApp.deleteSelected()}>
        Delete
      </button>
    </div>
  )
}
