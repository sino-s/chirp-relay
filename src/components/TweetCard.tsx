import type { JSX } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'
import { fetchConversation, setTweetLiked, setTweetRetweeted } from '../api/client'
import { RelaySettingsContext } from '../relay-context'
import { routeHref } from '../router'
import type { Tweet } from '../types'
import { twitterImageUrl } from '../media'
import { HeartIcon, LockIcon, PlayIcon, ReplyIcon, RepostIcon, ViewsIcon } from './Icons'
import { TweetText } from './TweetText'

function compactNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return ''
  const seconds = Math.round((timestamp - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 7) return formatter.format(days, 'day')
  return new Intl.DateTimeFormat('ja-JP', { month: 'short', day: 'numeric' }).format(timestamp)
}

function MediaGrid({ tweet }: { tweet: Tweet }): JSX.Element | null {
  if (tweet.media.length === 0) return null
  const gridClass = tweet.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
  return (
    <div class={`mt-3 grid ${gridClass} gap-0.5 overflow-hidden rounded-2xl border border-line bg-subtle`}>
      {tweet.media.map((media, index) => {
        const spanning = tweet.media.length === 3 && index === 0 ? 'row-span-2' : ''
        const mediaClass = `h-full max-h-[520px] min-h-36 w-full object-cover ${spanning}`
        const href = routeHref({ name: 'tweet', tweetId: tweet.id, media: index })
        if (media.type === 'photo' || !media.playbackUrl) {
          return (
            <a href={href} class={`relative z-20 ${spanning}`} aria-label={`画像 ${index + 1} を拡大表示`}>
              <img
                class={mediaClass}
                src={twitterImageUrl(media.previewUrl, 'small')}
                alt={media.altText ?? `投稿画像 ${index + 1}`}
                width={media.width ?? 1200}
                height={media.height ?? 675}
                loading="lazy"
                decoding="async"
              />
            </a>
          )
        }
        return (
          <a href={href} class={`relative z-20 ${spanning}`} aria-label="動画を再生">
            <img class={mediaClass} src={twitterImageUrl(media.previewUrl, 'small')} width={media.width ?? 1200} height={media.height ?? 675} alt="動画のプレビュー" loading="lazy" />
            <span class="absolute inset-0 grid place-items-center"><span class="grid size-14 place-items-center rounded-full bg-black/65 text-white"><PlayIcon size={30} /></span></span>
          </a>
        )
      })}
    </div>
  )
}

function QuoteCard({ tweet }: { tweet: Tweet }): JSX.Element {
  return (
    <div class="relative z-20 mt-3 rounded-2xl border border-line p-3 transition-colors hover:bg-hover">
      <a class="absolute inset-0 z-10 rounded-2xl" href={routeHref({ name: 'tweet', tweetId: tweet.id })} aria-label={`${tweet.author.name}の引用投稿を表示`} />
      <div class="flex min-w-0 items-center gap-2 text-sm">
        {tweet.author.avatarUrl ? <img src={tweet.author.avatarUrl} width="20" height="20" class="size-5 rounded-full" alt="" /> : null}
        <span class="truncate font-bold">{tweet.author.name}</span>
        {tweet.author.protected ? <span class="shrink-0 text-muted" aria-label="非公開アカウント"><LockIcon size={14} /></span> : null}
        <span class="truncate text-muted">@{tweet.author.handle}</span>
      </div>
      <p class="mt-1 whitespace-pre-wrap break-words text-[15px] leading-5"><TweetText text={tweet.text} links={tweet.links} mentions={tweet.mentions} /></p>
      {tweet.media[0] ? (
        <img class="mt-2 max-h-48 w-full rounded-xl object-cover" src={twitterImageUrl(tweet.media[0].previewUrl, 'small')} alt="引用投稿の画像" width={tweet.media[0].width ?? 600} height={tweet.media[0].height ?? 338} loading="lazy" />
      ) : null}
    </div>
  )
}

function LinkPreview({ tweet }: { tweet: Tweet }): JSX.Element | null {
  const preview = tweet.linkPreview
  if (!preview) return null
  return (
    <a class="relative z-20 mt-3 block overflow-hidden rounded-2xl border border-line transition-colors hover:bg-hover" href={preview.url} target="_blank" rel="noopener noreferrer" aria-label={`${preview.title}を開く`}>
      {preview.imageUrl ? <img class="aspect-[1.91/1] w-full bg-subtle object-cover" src={twitterImageUrl(preview.imageUrl, 'small')} width={preview.imageWidth ?? 680} height={preview.imageHeight ?? 356} alt="" loading="lazy" decoding="async" /> : null}
      <div class="px-3 py-2.5 text-[15px] leading-5">
        <p class="truncate text-muted">{preview.domain}</p>
        <p class="line-clamp-2 font-medium text-primary">{preview.title}</p>
        {preview.description ? <p class="mt-0.5 line-clamp-2 text-muted">{preview.description}</p> : null}
      </div>
    </a>
  )
}

function TweetMetrics({ tweet }: { tweet: Tweet }): JSX.Element {
  const settings = useContext(RelaySettingsContext)
  const [liked, setLiked] = useState(tweet.liked)
  const [retweeted, setRetweeted] = useState(tweet.retweeted)
  const [likes, setLikes] = useState(tweet.metrics.likes)
  const [reposts, setReposts] = useState(tweet.metrics.reposts)
  const [pending, setPending] = useState<'like' | 'retweet'>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    setLiked(tweet.liked)
    setRetweeted(tweet.retweeted)
    setLikes(tweet.metrics.likes)
    setReposts(tweet.metrics.reposts)
  }, [tweet.id, tweet.liked, tweet.metrics.likes, tweet.metrics.reposts, tweet.retweeted])

  async function toggleLike() {
    if (!settings || pending) return
    const next = !liked
    setPending('like')
    setError(undefined)
    setLiked(next)
    setLikes((value) => Math.max(0, value + (next ? 1 : -1)))
    try {
      await setTweetLiked(settings, tweet.id, next)
    } catch (reason) {
      setLiked(!next)
      setLikes(tweet.metrics.likes)
      setError(reason instanceof Error ? reason.message : 'いいねを更新できませんでした。')
      setPending(undefined)
      return
    }
    try {
      const verified = (await fetchConversation(settings, tweet.id)).focalTweet
      if (verified) {
        setLiked(verified.liked)
        setLikes(verified.metrics.likes)
      }
    } catch {
      setError('更新しました。再読み込み後に状態を確認できます。')
    } finally {
      setPending(undefined)
    }
  }

  async function toggleRetweet() {
    if (!settings || pending) return
    const next = !retweeted
    setPending('retweet')
    setError(undefined)
    setRetweeted(next)
    setReposts((value) => Math.max(0, value + (next ? 1 : -1)))
    try {
      await setTweetRetweeted(settings, tweet.id, next)
    } catch (reason) {
      setRetweeted(!next)
      setReposts(tweet.metrics.reposts)
      setError(reason instanceof Error ? reason.message : 'リツイートを更新できませんでした。')
      setPending(undefined)
      return
    }
    try {
      const verified = (await fetchConversation(settings, tweet.id)).focalTweet
      if (verified) {
        setRetweeted(verified.retweeted)
        setReposts(verified.metrics.reposts)
      }
    } catch {
      setError('更新しました。再読み込み後に状態を確認できます。')
    } finally {
      setPending(undefined)
    }
  }

  return (
    <>
      <div class="mt-3 flex max-w-md items-center justify-between text-muted" aria-label="投稿の反応">
        <span class="metric"><ReplyIcon size={18} /><span>{compactNumber(tweet.metrics.replies)}</span></span>
        <button class={`metric relative z-20 hover:text-[#00ba7c] ${retweeted ? 'text-[#00ba7c]' : ''}`} type="button" onClick={toggleRetweet} disabled={!settings || pending !== undefined} aria-label={retweeted ? 'リツイートを取り消す' : 'リツイート'} aria-pressed={retweeted}><RepostIcon size={18} /><span>{compactNumber(reposts)}</span></button>
        <button class={`metric relative z-20 hover:text-danger ${liked ? 'text-danger [&_svg]:fill-current' : ''}`} type="button" onClick={toggleLike} disabled={!settings || pending !== undefined} aria-label={liked ? 'いいねを取り消す' : 'いいね'} aria-pressed={liked}><HeartIcon size={18} /><span>{compactNumber(likes)}</span></button>
        {tweet.metrics.views !== undefined ? <span class="metric"><ViewsIcon size={18} /><span>{compactNumber(tweet.metrics.views)}</span></span> : <span />}
      </div>
      {error ? <p class="relative z-20 mt-2 text-xs text-danger" role="alert">{error}</p> : null}
    </>
  )
}

export function TweetCard({ tweet, detail = false }: { tweet: Tweet; detail?: boolean }): JSX.Element {
  return (
    <article class={`tweet-card relative border-b border-line px-4 py-3 ${detail ? 'py-4' : ''}`}>
      {!detail ? <a class="absolute inset-0 z-10" href={routeHref({ name: 'tweet', tweetId: tweet.id })} aria-label={`${tweet.author.name}の投稿を表示`} /> : null}
      {tweet.repostedBy ? (
        <div class="mb-1 ml-9 flex items-center gap-2 text-xs font-semibold text-muted">
          <RepostIcon size={15} /> {tweet.repostedBy}さんがリポスト
        </div>
      ) : null}
      <div class="flex gap-3">
        <a class="relative z-20 block size-10 shrink-0 self-start" href={routeHref({ name: 'user', handle: tweet.author.handle })} aria-label={`${tweet.author.name}のプロフィール`}>
          {tweet.author.avatarUrl ? (
            <img class="size-full rounded-full bg-subtle" src={tweet.author.avatarUrl} width="40" height="40" alt="" loading="lazy" />
          ) : (
            <span class="block size-10 rounded-full bg-subtle" />
          )}
        </a>
        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-1 text-[15px] leading-5">
            <a class="relative z-20 truncate font-bold hover:underline" href={routeHref({ name: 'user', handle: tweet.author.handle })}>
              {tweet.author.name}
            </a>
            {tweet.author.verified ? <span class="text-accent" aria-label="認証済み">◆</span> : null}
            {tweet.author.protected ? <span class="shrink-0 text-muted" aria-label="非公開アカウント"><LockIcon size={14} /></span> : null}
            <span class="truncate text-muted">@{tweet.author.handle}</span>
            <span aria-hidden="true" class="text-muted">·</span>
            <a class="relative z-20 shrink-0 text-muted hover:underline" href={routeHref({ name: 'tweet', tweetId: tweet.id })}>
              <time dateTime={tweet.createdAt}>{relativeTime(tweet.createdAt)}</time>
            </a>
          </div>
          <p class={`mt-0.5 whitespace-pre-wrap break-words leading-5.5 ${detail ? 'text-[17px]' : 'text-[15px]'}`}>
            <TweetText text={tweet.text} links={tweet.links} mentions={tweet.mentions} />
          </p>
          <MediaGrid tweet={tweet} />
          <LinkPreview tweet={tweet} />
          {tweet.quotedTweet ? <QuoteCard tweet={tweet.quotedTweet} /> : null}
          <TweetMetrics tweet={tweet} />
        </div>
      </div>
    </article>
  )
}
