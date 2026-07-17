import type { PlayEvent, SessionMeta } from '@/types'
import { appConfig } from '@/config/env'

const STORAGE_KEY = 'runway-defense:play-logs'

export class PlayLogService {
  private buffer: PlayEvent[] = []

  clear(): void {
    this.buffer = []
  }

  log(event: PlayEvent): void {
    if (!appConfig.features.playLog) return
    this.buffer.push(event)
  }

  getEvents(): PlayEvent[] {
    return [...this.buffer]
  }

  persistSession(meta: SessionMeta): void {
    if (!appConfig.features.playLog) return
    const existing = PlayLogService.loadAll()
    existing.push({ meta, events: this.getEvents() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }

  static loadAll(): Array<{ meta: SessionMeta; events: PlayEvent[] }> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as Array<{ meta: SessionMeta; events: PlayEvent[] }>
    } catch {
      return []
    }
  }
}

export const playLogService = new PlayLogService()
