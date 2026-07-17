export type ExportMultiplier = 1 | 2 | 4

export const EXPORT_MULTIPLIERS: ExportMultiplier[] = [1, 2, 4]

export const EXPORT_SIZE_HINTS: Record<
  ExportMultiplier,
  { label: string; sizeHint: string }
> = {
  1: { label: '1x', sizeHint: '1200 × 800, ~0.3MB' },
  2: { label: '2x', sizeHint: '2400 × 1600, ~1MB' },
  4: { label: '4x', sizeHint: '4800 × 3200, ~4MB' },
}

const SESSION_KEY = 'exportMultiplier'

export function buildExportFilename(
  name: string,
  multiplier: ExportMultiplier,
): string {
  const baseName = name.replace(/\s+/g, '-').toLowerCase() || 'stillgarden'
  const suffix = multiplier === 1 ? '' : `@${multiplier}x`
  return `${baseName}${suffix}.png`
}

export function readStoredExportMultiplier(): ExportMultiplier {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === '1' || saved === '4') return Number(saved) as ExportMultiplier
  } catch {
    // sessionStorage may be unavailable
  }
  return 2
}

export function storeExportMultiplier(multiplier: ExportMultiplier): void {
  try {
    sessionStorage.setItem(SESSION_KEY, String(multiplier))
  } catch {
    // sessionStorage may be unavailable
  }
}
