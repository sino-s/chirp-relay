import { useCallback, useEffect, useState } from 'preact/hooks'
import { fetchTwitterLists } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { ListIcon, LockIcon, WarningIcon } from '../components/Icons'
import { twitterImageUrl } from '../media'
import type { RelaySettings, TwitterList } from '../types'

export function ListsScreen({ settings, viewerId, selectedLists, onToggle, refreshToken = 0 }: { settings: RelaySettings; viewerId?: string; selectedLists: TwitterList[]; onToggle: (list: TwitterList) => void; refreshToken?: number }) {
  const [lists, setLists] = useState<TwitterList[]>([])
  const [cursor, setCursor] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()
  const [retryToken, setRetryToken] = useState(0)
  const selectedIds = new Set(selectedLists.map((list) => list.id))

  useEffect(() => {
    if (!viewerId) return
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    fetchTwitterLists(settings, viewerId, undefined, controller.signal).then((page) => {
      setLists(page.lists)
      setCursor(page.nextCursor)
      setLoading(false)
    }, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : 'リストを読み込めませんでした。')
      setLoading(false)
    })
    return () => controller.abort()
  }, [refreshToken, retryToken, settings, viewerId])

  const loadMore = useCallback(() => {
    if (!viewerId || !cursor || loadingMore) return
    setLoadingMore(true)
    setError(undefined)
    const requestedCursor = cursor
    fetchTwitterLists(settings, viewerId, requestedCursor).then((page) => {
      setLists((current) => {
        const byId = new Map(current.map((list) => [list.id, list]))
        for (const list of page.lists) byId.set(list.id, list)
        return [...byId.values()]
      })
      setCursor(page.nextCursor === requestedCursor ? undefined : page.nextCursor)
      setLoadingMore(false)
    }, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'リストの追加読み込みに失敗しました。')
      setLoadingMore(false)
    })
  }, [cursor, loadingMore, settings, viewerId])

  return (
    <section>
      <AppHeader title="リスト" />
      <p class="border-b border-line px-4 py-3 text-sm text-muted">ホームに表示するリストを選択できます。</p>
      {loading ? <ListSkeleton /> : null}
      {!loading && lists.length === 0 && !error ? <p class="px-6 py-16 text-center text-sm text-muted">表示できるリストがありません。</p> : null}
      {lists.map((list) => <ListCard key={list.id} list={list} selected={selectedIds.has(list.id)} onToggle={onToggle} />)}
      {error ? <div class="px-6 py-8 text-center" role="alert"><WarningIcon class="mx-auto text-danger" /><p class="mt-2 text-sm text-muted">{error}</p><button class="secondary-button mt-3" type="button" onClick={() => setRetryToken((value) => value + 1)}>再試行</button></div> : null}
      {cursor && !error ? <div class="grid p-5"><button class="secondary-button justify-self-center" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? '読み込み中' : 'さらに読み込む'}</button></div> : null}
    </section>
  )
}

function ListCard({ list, selected, onToggle }: { list: TwitterList; selected: boolean; onToggle: (list: TwitterList) => void }) {
  return (
    <button class="flex min-h-24 w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-hover" type="button" onClick={() => onToggle(list)} aria-pressed={selected} aria-label={`${list.name}をホーム${selected ? 'から外す' : 'に表示'}`}>
      {list.bannerUrl ? <img class="size-14 shrink-0 rounded-xl bg-subtle object-cover" src={twitterImageUrl(list.bannerUrl, 'small')} width="56" height="56" alt="" loading="lazy" /> : <span class="grid size-14 shrink-0 place-items-center rounded-xl bg-subtle text-muted"><ListIcon size={25} /></span>}
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-1 font-bold">{list.name}{list.private ? <span class="text-muted" aria-label="非公開リスト"><LockIcon size={14} /></span> : null}</span>
        {list.owner ? <span class="block truncate text-sm text-muted">@{list.owner.handle}</span> : null}
        {list.description ? <span class="mt-1 line-clamp-2 block text-sm">{list.description}</span> : null}
        <span class="mt-1 block text-xs text-muted">{list.memberCount.toLocaleString('ja-JP')}人のメンバー</span>
      </span>
      <span class={`grid size-6 shrink-0 place-items-center rounded border-2 ${selected ? 'border-accent bg-accent text-white' : 'border-muted'}`} aria-hidden="true">{selected ? '✓' : ''}</span>
    </button>
  )
}

function ListSkeleton() {
  return <div role="status" aria-label="リストを読み込み中">{[0, 1, 2, 3].map((item) => <div key={item} class="flex animate-pulse gap-3 border-b border-line px-4 py-4"><div class="size-14 rounded-xl bg-subtle" /><div class="flex-1 space-y-3"><div class="h-4 w-1/2 rounded bg-subtle" /><div class="h-3 w-1/3 rounded bg-subtle" /></div></div>)}</div>
}
