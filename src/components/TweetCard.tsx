import type { ComponentChildren, JSX } from 'preact'
import { routeHref } from '../router'
import type { Tweet, TweetLink } from '../types'
import { HeartIcon, PlayIcon, ReplyIcon, RepostIcon, ViewsIcon } from './Icons'

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

function linkedText(text: string, links: TweetLink[], tweetId: string): ComponentChildren[] {
  const detailHref = routeHref({ name: 'tweet', tweetId })
  if (links.length === 0) return [<a class="relative z-20" href={detailHref}>{text}</a>]
  const linkMap = new Map(links.map((link) => [link.url, link]))
  const pattern = new RegExp(`(${links.map((link) => link.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return text.split(pattern).map((part) => {
    const link = linkMap.get(part)
    if (!link) return <a class="relative z-20" href={detailHref}>{part}</a>
    return (
      <a class="relative z-20 text-accent hover:underline" href={link.expandedUrl} target="_blank" rel="noreferrer">
        {link.displayUrl}
      </a>
    )
  })
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
                src={`${media.previewUrl}?name=medium`}
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
            <img class={mediaClass} src={`${media.previewUrl}?name=medium`} width={media.width ?? 1200} height={media.height ?? 675} alt="動画のプレビュー" loading="lazy" />
            <span class="absolute inset-0 grid place-items-center"><span class="grid size-14 place-items-center rounded-full bg-black/65 text-white"><PlayIcon size={30} /></span></span>
          </a>
        )
      })}
    </div>
  )
}

function QuoteCard({ tweet }: { tweet: Tweet }): JSX.Element {
  return (
    <a
      class="relative z-20 mt-3 block rounded-2xl border border-line p-3 transition-colors hover:bg-hover"
      href={routeHref({ name: 'tweet', tweetId: tweet.id })}
    >
      <div class="flex min-w-0 items-center gap-2 text-sm">
        {tweet.author.avatarUrl ? <img src={tweet.author.avatarUrl} width="20" height="20" class="size-5 rounded-full" alt="" /> : null}
        <span class="truncate font-bold">{tweet.author.name}</span>
        <span class="truncate text-muted">@{tweet.author.handle}</span>
      </div>
      <p class="mt-1 whitespace-pre-wrap break-words text-[15px] leading-5">{tweet.text}</p>
      {tweet.media[0] ? (
        <img class="mt-2 max-h-48 w-full rounded-xl object-cover" src={`${tweet.media[0].previewUrl}?name=small`} alt="引用投稿の画像" width={tweet.media[0].width ?? 600} height={tweet.media[0].height ?? 338} loading="lazy" />
      ) : null}
    </a>
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
        <a class="relative z-20" href={routeHref({ name: 'user', handle: tweet.author.handle })} aria-label={`${tweet.author.name}のプロフィール`}>
          {tweet.author.avatarUrl ? (
            <img class="size-10 shrink-0 rounded-full bg-subtle" src={tweet.author.avatarUrl} width="40" height="40" alt="" loading="lazy" />
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
            <span class="truncate text-muted">@{tweet.author.handle}</span>
            <span aria-hidden="true" class="text-muted">·</span>
            <a class="relative z-20 shrink-0 text-muted hover:underline" href={routeHref({ name: 'tweet', tweetId: tweet.id })}>
              <time dateTime={tweet.createdAt}>{relativeTime(tweet.createdAt)}</time>
            </a>
          </div>
          <p class={`relative z-20 mt-0.5 whitespace-pre-wrap break-words leading-5.5 ${detail ? 'text-[17px]' : 'text-[15px]'}`}>
            {linkedText(tweet.text, tweet.links, tweet.id)}
          </p>
          <MediaGrid tweet={tweet} />
          {tweet.quotedTweet ? <QuoteCard tweet={tweet.quotedTweet} /> : null}
          <div class="mt-3 flex max-w-md items-center justify-between text-muted" aria-label="投稿の反応">
            <span class="metric"><ReplyIcon size={18} /><span>{compactNumber(tweet.metrics.replies)}</span></span>
            <span class="metric"><RepostIcon size={18} /><span>{compactNumber(tweet.metrics.reposts)}</span></span>
            <span class="metric"><HeartIcon size={18} /><span>{compactNumber(tweet.metrics.likes)}</span></span>
            {tweet.metrics.views !== undefined ? <span class="metric"><ViewsIcon size={18} /><span>{compactNumber(tweet.metrics.views)}</span></span> : <span />}
          </div>
        </div>
      </div>
    </article>
  )
}
