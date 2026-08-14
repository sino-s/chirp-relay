import { useCallback, useEffect, useState } from 'preact/hooks'
import { searchTwitter } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { SearchIcon } from '../components/Icons'
import { TimelineFeed } from '../components/TimelineFeed'
import { UserCard } from '../components/UserCard'
import { navigate, routeHref } from '../router'
import type { RelaySettings, SearchProduct, ViewerProfile } from '../types'

const TABS: { product: SearchProduct; label: string }[] = [
  { product: 'top', label: '話題' },
  { product: 'latest', label: '最新' },
  { product: 'people', label: 'ユーザー' },
  { product: 'media', label: 'メディア' }
]

export function SearchScreen({ settings, query, product }: { settings: RelaySettings; query: string; product: SearchProduct }) {
  const [input, setInput] = useState(query)
  useEffect(() => setInput(query), [query])
  const loadTweets = useCallback((cursor?: string, signal?: AbortSignal) => searchTwitter(settings, query, product, cursor, signal), [product, query, settings])

  function submit(event: SubmitEvent) {
    event.preventDefault()
    const nextQuery = input.trim()
    if (nextQuery) navigate({ name: 'search', query: nextQuery, product })
  }

  return (
    <section>
      <AppHeader title="検索">
        <form class="px-3 pb-2" role="search" onSubmit={submit}>
          <label class="flex min-h-11 items-center gap-2 rounded-full bg-subtle px-4 focus-within:outline-2 focus-within:outline-accent">
            <SearchIcon class="shrink-0 text-muted" size={19} />
            <span class="sr-only">Twitterを検索</span>
            <input class="min-w-0 flex-1 bg-transparent text-sm outline-none" name="query" type="search" value={input} onInput={(event) => setInput(event.currentTarget.value)} placeholder="キーワードを入力…" autoComplete="off" spellcheck={false} />
          </label>
        </form>
        <div class="grid grid-cols-4" role="tablist" aria-label="検索結果の種類">
          {TABS.map((tab) => <a key={tab.product} class={`relative grid h-11 place-items-center text-xs font-bold hover:bg-hover ${product === tab.product ? '' : 'text-muted'}`} href={routeHref({ name: 'search', query, product: tab.product })} role="tab" aria-selected={product === tab.product}>{tab.label}{product === tab.product ? <span class="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-accent" /> : null}</a>)}
        </div>
      </AppHeader>
      {!query ? <div class="px-8 py-20 text-center"><SearchIcon class="mx-auto text-muted" size={38} /><h2 class="mt-4 text-xl font-extrabold">検索する</h2><p class="mt-2 text-sm text-muted">キーワード、アカウント、画像や動画を検索できます。</p></div> : product === 'people' ? (
        <PeopleResults settings={settings} query={query} product={product} />
      ) : (
        <TimelineFeed loadPage={loadTweets} emptyMessage="検索結果がありません。" />
      )}
    </section>
  )
}

function PeopleResults({ settings, query, product }: { settings: RelaySettings; query: string; product: SearchProduct }) {
  const [users, setUsers] = useState<ViewerProfile[]>([])
  const [cursor, setCursor] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setUsers([])
    setError(undefined)
    searchTwitter(settings, query, product, undefined, controller.signal).then((page) => {
      setUsers(page.users)
      setCursor(page.nextCursor)
      setLoading(false)
    }, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : '検索に失敗しました。')
      setLoading(false)
    })
    return () => controller.abort()
  }, [product, query, settings])

  function loadMore() {
    if (!cursor) return
    const requested = cursor
    setCursor(undefined)
    setError(undefined)
    searchTwitter(settings, query, product, requested).then((page) => {
      setUsers((current) => {
        const byId = new Map(current.map((user) => [user.id, user]))
        for (const user of page.users) byId.set(user.id, user)
        return [...byId.values()]
      })
      setCursor(page.nextCursor === requested ? undefined : page.nextCursor)
    }, (reason: unknown) => setError(reason instanceof Error ? reason.message : '追加読み込みに失敗しました。'))
  }

  if (loading) return <div class="h-48 animate-pulse bg-subtle/30" role="status" aria-label="ユーザーを検索中" />
  if (error && users.length === 0) return <p class="px-6 py-16 text-center text-sm text-muted" role="alert">{error}</p>
  if (users.length === 0) return <p class="px-6 py-16 text-center text-sm text-muted">ユーザーが見つかりませんでした。</p>
  return <div>{users.map((user) => <UserCard key={user.id} user={user} />)}{error ? <p class="px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}{cursor ? <button class="secondary-button mx-auto my-5 flex" type="button" onClick={loadMore}>さらに表示</button> : null}</div>
}
