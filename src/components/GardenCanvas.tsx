import { useEffect, useRef } from 'react'
import { GardenApplication } from '@/game/GardenApplication'

type Props = {
  onReady: (app: GardenApplication) => void
}

export function GardenCanvas({ onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const app = new GardenApplication()
    let cancelled = false

    void app.mount(host).then(() => {
      if (!cancelled) onReady(app)
    })

    return () => {
      cancelled = true
      app.destroy()
    }
  }, [onReady])

  return <div className="canvas-host" ref={hostRef} />
}
