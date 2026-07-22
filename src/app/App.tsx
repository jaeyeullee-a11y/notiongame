import { lazy, Suspense, useEffect, useState } from 'react'

const EditorApp = lazy(() => import('@/app/EditorApp'))
const GalleryPage = lazy(() => import('@/pages/GalleryPage'))
const GardenShareView = lazy(() =>
  import('@/app/GardenShareView').then((mod) => ({
    default: mod.GardenShareView,
  })),
)

function normalizePathname(): string {
  const base = import.meta.env.BASE_URL || '/'
  let path = window.location.pathname
  if (base !== '/' && path.startsWith(base)) {
    path = path.slice(base.length - (base.endsWith('/') ? 1 : 0))
    if (!path.startsWith('/')) path = `/${path}`
  }
  return path.replace(/\/+$/, '') || '/'
}

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="gallery-page gallery-empty">
      <p>{label}</p>
    </div>
  )
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePathname())

  useEffect(() => {
    const onPopState = () => setPathname(normalizePathname())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (pathname === '/gallery') {
    return (
      <Suspense fallback={<RouteFallback label="갤러리를 불러오는 중…" />}>
        <GalleryPage />
      </Suspense>
    )
  }

  const gardenMatch = /^\/garden\/([^/]+)$/.exec(pathname)
  if (gardenMatch) {
    return (
      <Suspense fallback={<RouteFallback label="정원을 불러오는 중…" />}>
        <GardenShareView shareId={decodeURIComponent(gardenMatch[1])} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteFallback label="Stillgarden을 불러오는 중…" />}>
      <EditorApp />
    </Suspense>
  )
}
