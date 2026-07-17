import { create } from 'zustand'
import type {
  AssetCategory,
  BrushShape,
  BrushSize,
  EditorTool,
  TerrainTypeId,
} from '@/schemas/garden'
import { CommandStack } from '@/systems/command/CommandStack'
import type { GardenCommand } from '@/systems/command/types'

type DialogId =
  | 'save'
  | 'settings'
  | 'new'
  | 'onboarding'
  | 'auth'
  | 'export'
  | null

type EditorState = {
  tool: EditorTool
  previousTool: EditorTool
  selectedAssetId: string | null
  selectedObjectId: string | null
  terrainTypeId: TerrainTypeId
  brushSize: BrushSize
  brushShape: BrushShape
  assetPanelCollapsed: boolean
  assetCategory: AssetCategory | 'all'
  assetSearch: string
  observeMode: boolean
  observeUiHidden: boolean
  snapshotMode: boolean
  dialog: DialogId
  canUndo: boolean
  canRedo: boolean
  statusMessage: string | null
  commandStack: CommandStack

  setTool: (tool: EditorTool) => void
  setSelectedAssetId: (assetId: string | null) => void
  setSelectedObjectId: (instanceId: string | null) => void
  setTerrainTypeId: (terrainTypeId: TerrainTypeId) => void
  setBrushSize: (size: BrushSize) => void
  setBrushShape: (shape: BrushShape) => void
  setAssetPanelCollapsed: (collapsed: boolean) => void
  setAssetCategory: (category: AssetCategory | 'all') => void
  setAssetSearch: (query: string) => void
  setObserveMode: (enabled: boolean) => void
  setObserveUiHidden: (hidden: boolean) => void
  setSnapshotMode: (enabled: boolean) => void
  setDialog: (dialog: DialogId) => void
  setStatusMessage: (message: string | null) => void
  executeCommand: (command: GardenCommand) => void
  pushExecutedCommand: (command: GardenCommand) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
  syncHistoryFlags: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tool: 'select',
  previousTool: 'select',
  selectedAssetId: 'young-oak',
  selectedObjectId: null,
  terrainTypeId: 'grass',
  brushSize: 2,
  brushShape: 'round',
  assetPanelCollapsed: false,
  assetCategory: 'all',
  assetSearch: '',
  observeMode: false,
  observeUiHidden: false,
  snapshotMode: false,
  dialog: null,
  canUndo: false,
  canRedo: false,
  statusMessage: null,
  commandStack: new CommandStack(),

  setTool: (tool) =>
    set((state) => ({
      tool,
      previousTool: state.tool === 'observe' ? state.previousTool : state.tool,
      selectedObjectId: tool === 'place' ? null : state.selectedObjectId,
      observeMode: tool === 'observe',
      observeUiHidden: tool === 'observe',
    })),

  setSelectedAssetId: (assetId) =>
    set({
      selectedAssetId: assetId,
      tool: assetId ? 'place' : get().tool,
      selectedObjectId: null,
    }),

  setSelectedObjectId: (instanceId) => set({ selectedObjectId: instanceId }),

  setTerrainTypeId: (terrainTypeId) =>
    set({ terrainTypeId, tool: 'terrain' }),

  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushShape: (brushShape) => set({ brushShape }),
  setAssetPanelCollapsed: (assetPanelCollapsed) => set({ assetPanelCollapsed }),
  setAssetCategory: (assetCategory) => set({ assetCategory }),
  setAssetSearch: (assetSearch) => set({ assetSearch }),

  setObserveMode: (enabled) =>
    set((state) => ({
      observeMode: enabled,
      observeUiHidden: enabled,
      tool: enabled ? 'observe' : state.previousTool === 'observe' ? 'select' : state.previousTool,
    })),

  setObserveUiHidden: (observeUiHidden) => set({ observeUiHidden }),
  setSnapshotMode: (snapshotMode) => set({ snapshotMode }),
  setDialog: (dialog) => set({ dialog }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),

  executeCommand: (command) => {
    get().commandStack.execute(command)
    get().syncHistoryFlags()
  },

  pushExecutedCommand: (command) => {
    get().commandStack.pushExecuted(command)
    get().syncHistoryFlags()
  },

  undo: () => {
    if (get().commandStack.undo()) {
      get().syncHistoryFlags()
      set({ selectedObjectId: null, statusMessage: 'Undid last action' })
    }
  },

  redo: () => {
    if (get().commandStack.redo()) {
      get().syncHistoryFlags()
      set({ statusMessage: 'Redid last action' })
    }
  },

  clearHistory: () => {
    get().commandStack.clear()
    get().syncHistoryFlags()
  },

  syncHistoryFlags: () => {
    const stack = get().commandStack
    set({ canUndo: stack.canUndo, canRedo: stack.canRedo })
  },
}))
