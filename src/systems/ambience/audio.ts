import { Howl } from 'howler'
import type { GardenSettings } from '@/schemas/garden'

/**
 * Lightweight audio manager. Uses short generated data-URI tones so the MVP
 * works offline without binary music assets. Replace URLs with real loops later.
 */

function toneDataUri(
  frequency: number,
  durationSec: number,
  volume = 0.3,
  type: 'sine' | 'triangle' = 'sine',
): string {
  const sampleRate = 22050
  const samples = Math.floor(sampleRate * durationSec)
  const data = new Uint8Array(44 + samples * 2)
  const view = new DataView(data.buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples * 2, true)

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate
    const env = Math.min(1, t * 30) * Math.max(0, 1 - t / durationSec)
    const wave =
      type === 'sine'
        ? Math.sin(2 * Math.PI * frequency * t)
        : 2 * Math.abs(2 * ((t * frequency) % 1) - 1) - 1
    const sample = Math.max(-1, Math.min(1, wave * volume * env))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  let binary = ''
  for (let i = 0; i < data.length; i += 1) binary += String.fromCharCode(data[i]!)
  return `data:audio/wav;base64,${btoa(binary)}`
}

const SFX = {
  select: toneDataUri(520, 0.06, 0.2),
  place: toneDataUri(340, 0.08, 0.22, 'triangle'),
  paint: toneDataUri(220, 0.05, 0.15),
  delete: toneDataUri(180, 0.1, 0.2),
  undo: toneDataUri(400, 0.07, 0.18),
  save: toneDataUri(480, 0.12, 0.2, 'triangle'),
  snapshot: toneDataUri(660, 0.14, 0.22),
}

export class AudioManager {
  private music: Howl | null = null
  private ambience: Howl | null = null
  private sfx = new Map<string, Howl>()
  private settings: GardenSettings = {
    musicEnabled: true,
    ambienceEnabled: true,
    musicVolume: 0.45,
    ambienceVolume: 0.35,
  }
  private unlocked = false

  constructor() {
    for (const [name, src] of Object.entries(SFX)) {
      this.sfx.set(name, new Howl({ src: [src], volume: 0.4 }))
    }

    // Soft looping pads assembled from quiet tones
    this.music = new Howl({
      src: [toneDataUri(196, 2.5, 0.08), toneDataUri(246, 2.5, 0.06)],
      loop: true,
      volume: this.settings.musicVolume,
    })
    this.ambience = new Howl({
      src: [toneDataUri(140, 3, 0.04, 'triangle')],
      loop: true,
      volume: this.settings.ambienceVolume,
    })
  }

  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    this.applySettings(this.settings)
  }

  applySettings(settings: GardenSettings): void {
    this.settings = settings
    if (!this.unlocked) return

    if (this.music) {
      this.music.volume(settings.musicVolume)
      if (settings.musicEnabled) {
        if (!this.music.playing()) this.music.play()
      } else {
        this.music.pause()
      }
    }

    if (this.ambience) {
      this.ambience.volume(settings.ambienceVolume)
      if (settings.ambienceEnabled) {
        if (!this.ambience.playing()) this.ambience.play()
      } else {
        this.ambience.pause()
      }
    }
  }

  play(name: keyof typeof SFX): void {
    if (!this.unlocked) return
    this.sfx.get(name)?.play()
  }

  destroy(): void {
    this.music?.unload()
    this.ambience?.unload()
    for (const sound of this.sfx.values()) sound.unload()
  }
}

export const audioManager = new AudioManager()
