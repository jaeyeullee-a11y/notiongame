import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '@/stores/editorStore'

describe('editor hover state', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tool: 'select',
      previousTool: 'select',
      hoveredObjectId: null,
      observeMode: false,
      observeUiHidden: false,
      snapshotMode: false,
      selectedObjectId: null,
    })
  })

  it('stores the hovered object id', () => {
    useEditorStore.getState().setHoveredObjectId('oak-1')
    expect(useEditorStore.getState().hoveredObjectId).toBe('oak-1')
  })

  it('clears hover when observe mode starts', () => {
    useEditorStore.getState().setHoveredObjectId('oak-1')
    useEditorStore.getState().setObserveMode(true)
    expect(useEditorStore.getState().hoveredObjectId).toBeNull()
  })

  it('clears hover when leaving the select tool', () => {
    useEditorStore.getState().setHoveredObjectId('oak-1')
    useEditorStore.getState().setTool('place')
    expect(useEditorStore.getState().hoveredObjectId).toBeNull()
  })

  it('keeps hover while staying on the select tool', () => {
    useEditorStore.getState().setHoveredObjectId('oak-1')
    useEditorStore.getState().setTool('select')
    expect(useEditorStore.getState().hoveredObjectId).toBe('oak-1')
  })

  it('clears hover in snapshot mode', () => {
    useEditorStore.getState().setHoveredObjectId('oak-1')
    useEditorStore.getState().setSnapshotMode(true)
    expect(useEditorStore.getState().hoveredObjectId).toBeNull()
  })
})
