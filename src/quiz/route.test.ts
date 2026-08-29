import { describe, expect, it } from 'vitest'
import { isWorkshopRoute } from '@/quiz/route'

describe('isWorkshopRoute', () => {
  it('matches workshop paths including GitHub Pages base', () => {
    expect(isWorkshopRoute('/workshop')).toBe(true)
    expect(isWorkshopRoute('/workshop/')).toBe(true)
    expect(isWorkshopRoute('/notiongame/workshop')).toBe(true)
    expect(isWorkshopRoute('/')).toBe(false)
    expect(isWorkshopRoute('/garden')).toBe(false)
    expect(isWorkshopRoute('/', '#/workshop')).toBe(true)
  })
})
