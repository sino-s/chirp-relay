import type { SearchProduct } from './types'

export type NotificationTab = 'all' | 'mentions'

export type AppRoute =
  | { name: 'home' }
  | { name: 'profile' }
  | { name: 'user'; handle: string }
  | { name: 'tweet'; tweetId: string; media?: number }
  | { name: 'notifications'; tab: NotificationTab }
  | { name: 'search'; query: string; product: SearchProduct }

const SEARCH_PRODUCTS = new Set<SearchProduct>(['top', 'latest', 'people', 'media'])

export function parseHash(hash = window.location.hash): AppRoute {
  const raw = hash.replace(/^#\/?/, '')
  const [pathname = '', queryString = ''] = raw.split('?')
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const params = new URLSearchParams(queryString)

  if (segments[0] === 'profile') return { name: 'profile' }
  if (segments[0] === 'user' && segments[1]) return { name: 'user', handle: segments[1] }
  if (segments[0] === 'tweet' && segments[1]) {
    const rawMedia = params.get('media')
    const mediaValue = rawMedia === null || rawMedia === '' ? undefined : Number(rawMedia)
    return {
      name: 'tweet',
      tweetId: segments[1],
      media: mediaValue !== undefined && Number.isInteger(mediaValue) && mediaValue >= 0 ? mediaValue : undefined
    }
  }
  if (segments[0] === 'notifications') {
    return { name: 'notifications', tab: params.get('tab') === 'mentions' ? 'mentions' : 'all' }
  }
  if (segments[0] === 'search') {
    const requestedProduct = params.get('tab') as SearchProduct
    return {
      name: 'search',
      query: params.get('q') ?? '',
      product: SEARCH_PRODUCTS.has(requestedProduct) ? requestedProduct : 'top'
    }
  }
  return { name: 'home' }
}

export function routeHref(route: AppRoute): string {
  if (route.name === 'home' || route.name === 'profile') return `#/${route.name}`
  if (route.name === 'user') return `#/user/${encodeURIComponent(route.handle)}`
  if (route.name === 'tweet') {
    const media = route.media === undefined ? '' : `?media=${route.media}`
    return `#/tweet/${encodeURIComponent(route.tweetId)}${media}`
  }
  if (route.name === 'notifications') return `#/notifications?tab=${route.tab}`
  const params = new URLSearchParams()
  if (route.query) params.set('q', route.query)
  params.set('tab', route.product)
  return `#/search?${params}`
}

export function navigate(route: AppRoute, replace = false): void {
  const href = routeHref(route)
  if (replace) window.location.replace(href)
  else window.location.hash = href.slice(1)
}

const HISTORY_INDEX_KEY = 'chirpHistoryIndex'

export function ensureAppHistoryEntry(): number {
  const stored = window.history.state?.[HISTORY_INDEX_KEY]
  if (typeof stored === 'number' && Number.isInteger(stored) && stored >= 0) return stored
  window.history.replaceState({ ...window.history.state, [HISTORY_INDEX_KEY]: 0 }, '', window.location.href)
  return 0
}

export function markAppHistoryEntry(previousIndex: number): number {
  const stored = window.history.state?.[HISTORY_INDEX_KEY]
  if (typeof stored === 'number' && Number.isInteger(stored) && stored >= 0) return stored
  const nextIndex = previousIndex + 1
  window.history.replaceState({ ...window.history.state, [HISTORY_INDEX_KEY]: nextIndex }, '', window.location.href)
  return nextIndex
}

export function canGoBackInApp(): boolean {
  const stored = window.history.state?.[HISTORY_INDEX_KEY]
  return typeof stored === 'number' && stored > 0
}

export function routeScrollKey(route: AppRoute): string {
  if (route.name === 'tweet') return `tweet:${route.tweetId}`
  if (route.name === 'user') return `user:${route.handle}`
  if (route.name === 'notifications') return `notifications:${route.tab}`
  if (route.name === 'search') return `search:${route.product}:${route.query}`
  return route.name
}
