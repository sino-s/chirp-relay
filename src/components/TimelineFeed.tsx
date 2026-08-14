import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import type { TimelinePage, Tweet } from '../types'
import { WarningIcon } from './Icons'
import { TweetCard } from './TweetCard'

interface TimelineFeedProps {
  enabled?: boolean
  emptyMessage?: string
  loadPage: (cursor?: string, signal?: AbortSignal) => Promise<TimelinePage>
  refreshToken?: number
}

interface FeedState {
  tweets: Tweet[]
  cursor?: string
  loading: boolean
  loadingMore: boolean
  error?: string
}

const INITIAL_STATE: FeedState = { tweets: [], loading: true, loadingMore: false }

export function TimelineFeed({ enabled = true, emptyMessage = '表示できる投稿がありません。', loadPage, refreshToken = 0 }: TimelineFeedProps) {
  const [state, setState] = useState<FeedState>(INITIAL_STATE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback((signal?: AbortSignal) => {
    setState(INITIAL_STATE)
    loadPage(undefined, signal).then(
      (page) => setState({ tweets: page.tweets, cursor: page.nextCursor, loading: false, loadingMore: false }),
      (error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ tweets: [], loading: false, loadingMore: false, error: error instanceof Error ? error.message : '読み込みに失敗しました。' })
      }
    )
  }, [loadPage])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    loadInitial(controller.signal)
    return () => controller.abort()
  }, [enabled, loadInitial, refreshToken])

  const loadMore = useCallback(() => {
    if (!state.cursor || state.loading || state.loadingMore) return
    const requestedCursor = state.cursor
    setState((current) => ({ ...current, loadingMore: true, error: undefined }))
    loadPage(requestedCursor).then(
      (page) => setState((current) => {
        const byId = new Map(current.tweets.map((tweet) => [tweet.id, tweet]))
        for (const tweet of page.tweets) byId.set(tweet.id, tweet)
        return { tweets: [...byId.values()], cursor: page.nextCursor === requestedCursor ? undefined : page.nextCursor, loading: false, loadingMore: false }
      }),
      (error: unknown) => setState((current) => ({
        ...current,
        loadingMore: false,
        error: error instanceof Error ? error.message : '追加読み込みに失敗しました。'
      }))
    )
  }, [loadPage, state.cursor, state.loading, state.loadingMore])

  useEffect(() => {
    if (!enabled || !sentinelRef.current || !state.cursor) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loadMore()
    }, { rootMargin: '500px 0px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [enabled, loadMore, state.cursor])

  if (!enabled) return null
  if (state.loading) return <FeedSkeleton />
  if (state.tweets.length === 0 && state.error) return <ErrorState message={state.error} onRetry={() => loadInitial()} />
  if (state.tweets.length === 0) return <p class="px-6 py-16 text-center text-sm text-muted">{emptyMessage}</p>

  return (
    <div>
      {state.tweets.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)}
      {state.error ? <ErrorState compact message={state.error} onRetry={loadMore} /> : null}
      <div ref={sentinelRef} class="flex h-20 items-center justify-center" aria-live="polite">
        {state.loadingMore ? <Spinner label="続きを読み込み中" /> : null}
      </div>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return <span class="size-6 animate-spin rounded-full border-2 border-line border-t-accent" role="status" aria-label={label} />
}

function FeedSkeleton() {
  return (
    <div aria-label="タイムラインを読み込み中" role="status">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} class="flex animate-pulse gap-3 border-b border-line px-4 py-4">
          <div class="size-10 shrink-0 rounded-full bg-subtle" />
          <div class="flex-1 space-y-3"><div class="h-3 w-2/5 rounded bg-subtle" /><div class="h-3 w-full rounded bg-subtle" /><div class="h-3 w-4/5 rounded bg-subtle" /></div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry, compact = false }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div class={`flex flex-col items-center gap-3 px-6 text-center ${compact ? 'py-6' : 'py-16'}`} role="alert">
      <WarningIcon class="text-danger" size={compact ? 22 : 30} />
      <p class="max-w-sm text-sm text-muted">{message}</p>
      <button class="rounded-full border border-line px-4 py-2 text-sm font-bold hover:bg-hover" type="button" onClick={onRetry}>再試行</button>
    </div>
  )
}
