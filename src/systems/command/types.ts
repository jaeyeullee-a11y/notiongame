export interface GardenCommand {
  id: string
  label: string
  execute(): void
  undo(): void
}
