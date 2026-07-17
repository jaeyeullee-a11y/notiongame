import type { VocSubmission } from '@/types'
import { appConfig } from '@/config/env'

const STORAGE_KEY = 'runway-defense:voc'

export class VocService {
  submit(submission: VocSubmission): { ok: true } | { ok: false; error: string } {
    if (!appConfig.features.vocSubmit) {
      return { ok: false, error: 'VOC 제출이 비활성화되어 있습니다.' }
    }
    try {
      const all = VocService.loadAll()
      all.push(submission)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
      return { ok: true }
    } catch {
      return { ok: false, error: '저장에 실패했습니다. 다시 시도해 주세요.' }
    }
  }

  static loadAll(): VocSubmission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as VocSubmission[]
    } catch {
      return []
    }
  }
}

export const vocService = new VocService()
