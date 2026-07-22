import { getStore } from '@netlify/blobs'

export type BlobStoreName =
  | 'stillgarden-users'
  | 'stillgarden-saves'
  | 'stillgarden-shares'
  | 'stillgarden-gallery-index'
  | 'stillgarden-gallery-likes'
  | 'stillgarden-gallery-counts'
  | 'stillgarden-gallery-thumbs'

/** Site-wide blob store with strong read-after-write consistency. */
export function accountStore(name: BlobStoreName) {
  return getStore({
    name,
    consistency: 'strong',
  })
}

export async function readJson<T>(
  store: ReturnType<typeof getStore>,
  key: string,
): Promise<T | null> {
  const value = await store.get(key, { type: 'json' })
  if (value == null) return null
  return value as T
}

export async function writeJson(
  store: ReturnType<typeof getStore>,
  key: string,
  value: unknown,
): Promise<void> {
  await store.setJSON(key, value)
  // Verify persistence — surfaces silent Blobs misconfiguration early.
  const verify = await store.get(key, { type: 'json' })
  if (verify == null) {
    throw new Error(
      '저장소 쓰기에 실패했습니다. Netlify Blobs 설정을 확인해 주세요.',
    )
  }
}

export async function deleteKey(
  store: ReturnType<typeof getStore>,
  key: string,
): Promise<void> {
  await store.delete(key)
}
