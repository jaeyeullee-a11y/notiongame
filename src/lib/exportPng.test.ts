import { describe, expect, it } from 'vitest'
import { buildExportFilename } from '@/lib/exportPng'

describe('exportPng filename suffix', () => {
  it('1x에서 접미사 없음', () => {
    expect(buildExportFilename('my garden', 1)).toBe('my-garden.png')
  })

  it('2x에서 @2x 접미사', () => {
    expect(buildExportFilename('my garden', 2)).toBe('my-garden@2x.png')
  })

  it('4x에서 @4x 접미사', () => {
    expect(buildExportFilename('my garden', 4)).toBe('my-garden@4x.png')
  })

  it('이름 빈 문자열일 때 fallback', () => {
    expect(buildExportFilename('', 2)).toBe('stillgarden@2x.png')
  })
})
