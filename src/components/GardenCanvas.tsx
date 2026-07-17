import { useEffect, useRef } from 'react'
import { GardenApplication } from '@/game/GardenApplication'

type Props = {
  onReady: (app: GardenApplication) => void
}

export function GardenCanvas({ onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const app = new GardenApplication()
    let cancelled = false

    void app.mount(host).then(() => {
      if (!cancelled) onReadyRef.current(app)
    })

    return () => {
      cancelled = true
      app.destroy()
    }
  }, [])

  return <div className="canvas-host" ref={hostRef} />
}
