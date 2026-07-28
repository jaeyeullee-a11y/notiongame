import { beforeEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from '@/systems/ambience/audio'
import { useEditorStore } from '@/stores/editorStore'
import { useGardenStore } from '@/stores/gardenStore'

vi.mock('@/systems/ambience/audio', () => ({
  audioManager: {
    unlock: vi.fn(),
    applySettings: vi.fn(),
    play: vi.fn(),
  },
}))

describe('editorStore master mute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEditorStore.setState({ masterMuted: false })
    useGardenStore.setState({
      settings: {
        musicEnabled: true,
        ambienceEnabled: true,
        musicVolume: 0.45,
        ambienceVolume: 0.35,
      },
    })
  })

  it('toggles masterMuted on each call', () => {
    useEditorStore.getState().toggleMasterMute()
    expect(useEditorStore.getState().masterMuted).toBe(true)

    useEditorStore.getState().toggleMasterMute()
    expect(useEditorStore.getState().masterMuted).toBe(false)
  })

  it('mutes both channels via applySettings without changing garden settings', () => {
    useEditorStore.getState().toggleMasterMute()

    expect(audioManager.unlock).toHaveBeenCalled()
    expect(audioManager.applySettings).toHaveBeenCalledWith({
      musicEnabled: false,
      ambienceEnabled: false,
      musicVolume: 0.45,
      ambienceVolume: 0.35,
    })
    expect(useGardenStore.getState().settings).toEqual({
      musicEnabled: true,
      ambienceEnabled: true,
      musicVolume: 0.45,
      ambienceVolume: 0.35,
    })
  })

  it('restores garden channel settings when unmuting', () => {
    useGardenStore.setState({
      settings: {
        musicEnabled: false,
        ambienceEnabled: true,
        musicVolume: 0.2,
        ambienceVolume: 0.8,
      },
    })

    useEditorStore.getState().toggleMasterMute()
    vi.clearAllMocks()
    useEditorStore.getState().toggleMasterMute()

    expect(audioManager.unlock).toHaveBeenCalled()
    expect(audioManager.applySettings).toHaveBeenCalledWith({
      musicEnabled: false,
      ambienceEnabled: true,
      musicVolume: 0.2,
      ambienceVolume: 0.8,
    })
    expect(useEditorStore.getState().masterMuted).toBe(false)
  })

  it('calls unlock on both mute and unmute', () => {
    useEditorStore.getState().toggleMasterMute()
    useEditorStore.getState().toggleMasterMute()
    expect(audioManager.unlock).toHaveBeenCalledTimes(2)
  })
})
