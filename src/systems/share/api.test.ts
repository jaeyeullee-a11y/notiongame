import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNewGardenSave } from '@/systems/generator/surpriseMe'
import { createShareLink, loadSharedGarden } from '@/systems/share/api'

describe('share api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('createShareLink returns shareId and shareUrl', async () => {
    const garden = createNewGardenSave('Share Me', 'empty')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          shareId: 'abc123XYZ0',
          shareUrl: 'https://example.com/garden/abc123XYZ0',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const result = await createShareLink('gardener', garden)

    expect(result).toEqual({
      shareId: 'abc123XYZ0',
      shareUrl: 'https://example.com/garden/abc123XYZ0',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/share',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('createShareLink throws on API error', async () => {
    const garden = createNewGardenSave('Share Me', 'empty')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: '로그인된 계정을 찾을 수 없습니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(createShareLink('missing', garden)).rejects.toThrow(
      '로그인된 계정을 찾을 수 없습니다.',
    )
  })

  it('loadSharedGarden parses a valid response', async () => {
    const garden = createNewGardenSave('Visitor Garden', 'surprise', 7)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          garden,
          thumbnailDataUrl: 'data:image/png;base64,abc',
          createdAt: '2026-07-17T00:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const result = await loadSharedGarden('abc123XYZ0')
    expect(result?.garden.name).toBe('Visitor Garden')
    expect(result?.createdAt).toBe('2026-07-17T00:00:00.000Z')
    expect(result?.thumbnailDataUrl).toContain('data:image/png')
  })

  it('loadSharedGarden returns null on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: '정원을 찾을 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(loadSharedGarden('missing-id')).resolves.toBeNull()
  })
})
