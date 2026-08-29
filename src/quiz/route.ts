export function isWorkshopRoute(pathname: string, hash = ''): boolean {
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  if (trimmed === '/workshop' || trimmed.endsWith('/workshop')) return true
  return hash === '#/workshop' || hash.startsWith('#/workshop')
}
