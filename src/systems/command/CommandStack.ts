import theme from '@/data/theme.json'
import type { GardenCommand } from '@/systems/command/types'

export class CommandStack {
  private undoStack: GardenCommand[] = []
  private redoStack: GardenCommand[] = []
  private readonly maxSize: number

  constructor(maxSize = theme.editor.maxUndo) {
    this.maxSize = maxSize
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  get undoLabel(): string | null {
    return this.undoStack.at(-1)?.label ?? null
  }

  get redoLabel(): string | null {
    return this.redoStack.at(-1)?.label ?? null
  }

  execute(command: GardenCommand): void {
    command.execute()
    this.undoStack.push(command)
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  pushExecuted(command: GardenCommand): void {
    this.undoStack.push(command)
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo(): boolean {
    const command = this.undoStack.pop()
    if (!command) return false
    command.undo()
    this.redoStack.push(command)
    return true
  }

  redo(): boolean {
    const command = this.redoStack.pop()
    if (!command) return false
    command.execute()
    this.undoStack.push(command)
    return true
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  get size(): number {
    return this.undoStack.length
  }
}
