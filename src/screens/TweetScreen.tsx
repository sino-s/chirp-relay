import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { fetchConversation } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { MediaViewer } from '../components/MediaViewer'
import { TweetCard } from '../components/TweetCard'
import { navigate } from '../router'
import type { ConversationPage, RelaySettings, Tweet } from '../types'

export function TweetScreen({ settings, tweetId, media, onSettings }: { settings: RelaySettings; tweetId: string; media?: number; onSettings: () => void }) {
  const [conversation, setConversation] = useState<ConversationPage>()
  const [replies, setReplies] = useState<Tweet[]>([])
  const [cursor, setCursor] = useState<string>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(() => {
    const controller = new AbortController()
    setConversation(undefined)
    setReplies([])
    setError(undefined)
    fetchConversation(settings, tweetId, undefined, controller.signal).then((page) => {
      setConversation(page)
      setReplies(page.replies)
      setCursor(page.nextCursor)
    }, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : '投稿を読み込めませんでした。')
    })
    return controller
  }, [settings, tweetId])

  useEffect(() => {
    const controller = loadInitial()
    return () => controller.abort()
  }, [loadInitial])

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setError(undefined)
    fetchConversation(settings, tweetId, cursor).then((page) => {
      setReplies((current) => {
        const byId = new Map(current.map((tweet) => [tweet.id, tweet]))
        for (const tweet of page.replies) byId.set(tweet.id, tweet)
        return [...byId.values()]
      })
      setCursor(page.nextCursor === cursor ? undefined : page.nextCursor)
      setLoadingMore(false)
    }, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : '返信の追加読み込みに失敗しました。')
      setLoadingMore(false)
    })
  }, [cursor, loadingMore, settings, tweetId])

  useEffect(() => {
    if (!cursor || !sentinelRef.current) return
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) loadMore() }, { rootMargin: '400px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [cursor, loadMore])

  function goBack() {
    if (window.history.length > 1) window.history.back()
    else navigate({ name: 'home' }, true)
  }

  return (
    <section>
      <AppHeader title="ポスト" onBack={goBack} onSettings={onSettings} />
      {error && !conversation ? <ErrorState message={error} onRetry={loadInitial} /> : null}
      {!conversation && !error ? <div class="h-48 animate-pulse border-b border-line bg-subtle/40" role="status" aria-label="投稿を読み込み中" /> : null}
      {conversation ? (
        <>
          {conversation.ancestors.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)}
          {conversation.focalTweet ? <TweetCard tweet={conversation.focalTweet} detail /> : <ErrorState message="投稿が見つかりませんでした。" onRetry={loadInitial} />}
          {replies.length > 0 ? <h2 class="border-b border-line px-4 py-3 text-sm font-bold">返信</h2> : null}
          {replies.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)}
          {error ? <ErrorState compact message={error} onRetry={loadMore} /> : null}
          <div ref={sentinelRef} class="grid h-20 place-items-center" aria-live="polite">{loadingMore ? <span class="size-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="返信を読み込み中" /> : null}</div>
          {media !== undefined && conversation.focalTweet?.media[media] ? <MediaViewer tweet={conversation.focalTweet} initialIndex={media} /> : null}
        </>
      ) : null}
    </section>
  )
}

function ErrorState({ message, onRetry, compact = false }: { message: string; onRetry: () => unknown; compact?: boolean }) {
  return <div class={`px-6 text-center ${compact ? 'py-5' : 'py-16'}`} role="alert"><p class="text-sm text-muted">{message}</p><button class="secondary-button mt-3" type="button" onClick={onRetry}>再試行</button></div>
}
