import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { fetchNotifications } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { BellIcon, HeartIcon, RepostIcon, UserIcon } from '../components/Icons'
import { routeHref } from '../router'
import type { NotificationItem, RelaySettings } from '../types'

export function NotificationsScreen({ settings, tab, onSettings }: { settings: RelaySettings; tab: 'all' | 'mentions'; onSettings: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [cursor, setCursor] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()
  const [refresh, setRefresh] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setItems([])
    setError(undefined)
    fetchNotifications(settings, tab, undefined, controller.signal).then((page) => {
      setItems(page.notifications)
      setCursor(page.nextCursor)
      setLoading(false)
    }, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : '通知を読み込めませんでした。')
      setLoading(false)
    })
    return () => controller.abort()
  }, [settings, tab, refresh])

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setError(undefined)
    fetchNotifications(settings, tab, cursor).then((page) => {
      setItems((current) => {
        const byId = new Map(current.map((item) => [item.id, item]))
        for (const item of page.notifications) byId.set(item.id, item)
        return [...byId.values()]
      })
      setCursor(page.nextCursor === cursor ? undefined : page.nextCursor)
      setLoadingMore(false)
    }, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : '通知の追加読み込みに失敗しました。')
      setLoadingMore(false)
    })
  }, [cursor, loadingMore, settings, tab])

  useEffect(() => {
    if (!cursor || !sentinelRef.current) return
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) loadMore() }, { rootMargin: '400px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [cursor, loadMore])

  return (
    <section>
      <AppHeader title="通知" onRefresh={() => setRefresh((value) => value + 1)} onSettings={onSettings}>
        <div class="grid grid-cols-2" role="tablist" aria-label="通知の種類">
          <NotificationTab active={tab === 'all'} href={routeHref({ name: 'notifications', tab: 'all' })}>すべて</NotificationTab>
          <NotificationTab active={tab === 'mentions'} href={routeHref({ name: 'notifications', tab: 'mentions' })}>メンション</NotificationTab>
        </div>
      </AppHeader>
      {loading ? <NotificationSkeleton /> : null}
      {!loading && items.length === 0 && !error ? <p class="px-6 py-16 text-center text-sm text-muted">通知はありません。</p> : null}
      {items.map((item) => <NotificationCard key={item.id} item={item} />)}
      {error ? <div class="px-6 py-6 text-center" role="alert"><p class="text-sm text-muted">{error}</p><button class="secondary-button mt-3" type="button" onClick={items.length ? loadMore : () => setRefresh((value) => value + 1)}>再試行</button></div> : null}
      <div ref={sentinelRef} class="grid h-20 place-items-center" aria-live="polite">{loadingMore ? <span class="size-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="通知を読み込み中" /> : null}</div>
    </section>
  )
}

function NotificationTab({ active, href, children }: { active: boolean; href: string; children: string }) {
  return <a class={`relative grid h-12 place-items-center text-sm font-bold hover:bg-hover ${active ? '' : 'text-muted'}`} href={href} role="tab" aria-selected={active}>{children}{active ? <span class="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-accent" /> : null}</a>
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const href = item.targetTweet
    ? routeHref({ name: 'tweet', tweetId: item.targetTweet.id })
    : item.actors[0]
      ? routeHref({ name: 'user', handle: item.actors[0].handle })
      : undefined
  const iconClass = item.kind.toLowerCase()
  const Icon = iconClass.includes('heart') || iconClass.includes('like') ? HeartIcon : iconClass.includes('retweet') ? RepostIcon : iconClass.includes('follow') || iconClass.includes('person') ? UserIcon : BellIcon
  return (
    <article class="relative border-b border-line px-4 py-3 hover:bg-hover">
      {href ? <a class="absolute inset-0 z-10" href={href} aria-label="通知の内容を表示" /> : null}
      <div class="flex gap-3">
        <Icon class="mt-1 shrink-0 text-accent" />
        <div class="min-w-0 flex-1">
          <div class="relative z-20 flex -space-x-1">
            {item.actors.slice(0, 5).map((actor) => <a key={actor.id} class="block size-8 rounded-full border-2 border-canvas bg-subtle" href={routeHref({ name: 'user', handle: actor.handle })} aria-label={`${actor.name}のプロフィール`}>{actor.avatarUrl ? <img class="size-full rounded-full" src={actor.avatarUrl} width="32" height="32" alt="" loading="lazy" /> : null}</a>)}
          </div>
          <p class="mt-2 break-words text-sm leading-5">{item.message || `${item.actors[0]?.name ?? 'ユーザー'}からの通知`}</p>
          {item.targetTweet ? <p class="mt-1 line-clamp-3 break-words text-sm text-muted">{item.targetTweet.text}</p> : null}
          {item.timestamp ? <time class="mt-1 block text-xs text-muted" dateTime={new Date(item.timestamp).toISOString()}>{new Intl.DateTimeFormat('ja-JP', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(item.timestamp)}</time> : null}
        </div>
      </div>
    </article>
  )
}

function NotificationSkeleton() {
  return <div role="status" aria-label="通知を読み込み中">{[0, 1, 2, 3].map((item) => <div key={item} class="flex animate-pulse gap-3 border-b border-line px-4 py-5"><div class="size-7 rounded bg-subtle" /><div class="flex-1 space-y-3"><div class="h-8 w-24 rounded bg-subtle" /><div class="h-3 w-4/5 rounded bg-subtle" /></div></div>)}</div>
}
