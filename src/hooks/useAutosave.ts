import { useEffect, useRef } from 'react'
import theme from '@/data/theme.json'
import { audioManager } from '@/systems/ambience/audio'
import { saveSlot } from '@/systems/save/repository'
import { useAuthStore } from '@/stores/authStore'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenApplication } from '@/game/GardenApplication'

export function useAutosave(gardenApp: GardenApplication | null): void {
  const user = useAuthStore((s) => s.user)
  const dirty = useGardenStore((s) => s.dirty)
  const activeSlot = useGardenStore((s) => s.activeSlot)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const persist = async () => {
      const state = useGardenStore.getState()
      const username = useAuthStore.getState().user?.username
      if (!username || !state.dirty || !state.activeSlot) return
      try {
        const thumbnail = await gardenApp?.captureThumbnail()
        await saveSlot(state.activeSlot, state.toSaveData(), thumbnail)
        state.markClean()
      } catch (error) {
        console.error(error)
      }
    }

    if (!dirty || !user) return

    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void persist()
    }, theme.editor.autosaveIdleMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [dirty, activeSlot, gardenApp, user])

  useEffect(() => {
    const onBlur = () => {
      const state = useGardenStore.getState()
      const username = useAuthStore.getState().user?.username
      if (!username || !state.dirty || !state.activeSlot) return
      void (async () => {
        const thumbnail = await gardenApp?.captureThumbnail()
        await saveSlot(state.activeSlot!, state.toSaveData(), thumbnail)
        state.markClean()
        audioManager.play('save')
      })()
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [gardenApp])
}
