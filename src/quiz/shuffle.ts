export function shuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items]
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  for (let i = copy.length - 1; i > 0; i -= 1) {
    hash = Math.imul(hash, 1664525) + 1013904223
    const j = Math.abs(hash) % (i + 1)
    const current = copy[i]
    const swap = copy[j]
    if (current === undefined || swap === undefined) continue
    copy[i] = swap
    copy[j] = current
  }
  return copy
}
