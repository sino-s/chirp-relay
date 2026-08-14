import { useEffect, useRef, useState } from 'preact/hooks'
import { canGoBackInApp, navigate } from '../router'
import { twitterImageUrl } from '../media'
import type { Tweet, TweetMedia } from '../types'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons'

export function MediaViewer({ tweet, initialIndex }: { tweet: Tweet; initialIndex: number }) {
  const safeIndex = Math.min(Math.max(initialIndex, 0), Math.max(tweet.media.length - 1, 0))
  const [activeIndex, setActiveIndex] = useState(safeIndex)
  const closeRef = useRef<HTMLButtonElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') show(activeIndex - 1)
      if (event.key === 'ArrowRight') show(activeIndex + 1)
      if (event.key === 'Tab') {
        const focusable = [...(viewerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), video[controls]') ?? [])]
        if (focusable.length === 0) return
        const current = focusable.indexOf(document.activeElement as HTMLElement)
        const next = event.shiftKey
          ? focusable[(current <= 0 ? focusable.length : current) - 1]
          : focusable[(current + 1) % focusable.length]
        event.preventDefault()
        next?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex])

  useEffect(() => {
    const slide = trackRef.current?.children.item(safeIndex)
    slide?.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' })
  }, [safeIndex])

  function close() {
    if (canGoBackInApp()) window.history.back()
    else navigate({ name: 'tweet', tweetId: tweet.id }, true)
  }

  function show(index: number) {
    if (index < 0 || index >= tweet.media.length) return
    setActiveIndex(index)
    trackRef.current?.children.item(index)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    navigate({ name: 'tweet', tweetId: tweet.id, media: index }, true)
  }

  return (
    <div ref={viewerRef} class="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="メディアビューア">
      <div class="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button ref={closeRef} class="grid size-11 place-items-center rounded-full bg-black/45 hover:bg-black/70" type="button" onClick={close} aria-label="メディアを閉じる"><CloseIcon /></button>
        <span class="rounded-full bg-black/45 px-3 py-1 text-sm tabular-nums">{activeIndex + 1} / {tweet.media.length}</span>
      </div>
      <div ref={trackRef} class="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [touch-action:pan-x_pinch-zoom]" onScroll={(event) => {
        const element = event.currentTarget
        const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1))
        if (index !== activeIndex && index >= 0 && index < tweet.media.length) {
          setActiveIndex(index)
          navigate({ name: 'tweet', tweetId: tweet.id, media: index }, true)
        }
      }}>
        {tweet.media.map((media, index) => (
          <div key={media.id} class="grid min-w-full snap-center place-items-center p-2 pt-16 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {media.type === 'photo' || !media.playbackUrl ? (
              <img class="max-h-full max-w-full object-contain" src={twitterImageUrl(media.previewUrl, index === activeIndex ? 'orig' : 'small')} width={media.width ?? 1200} height={media.height ?? 675} alt={media.altText ?? `投稿画像 ${index + 1}`} />
            ) : <VideoPlayer media={media} />}
          </div>
        ))}
      </div>
      {activeIndex > 0 ? <button class="media-arrow left-3" type="button" onClick={() => show(activeIndex - 1)} aria-label="前の画像"><ChevronLeftIcon size={28} /></button> : null}
      {activeIndex + 1 < tweet.media.length ? <button class="media-arrow right-3" type="button" onClick={() => show(activeIndex + 1)} aria-label="次の画像"><ChevronRightIcon size={28} /></button> : null}
    </div>
  )
}

function VideoPlayer({ media }: { media: TweetMedia }) {
  const sources = media.playbackUrls?.length ? media.playbackUrls : media.playbackUrl ? [media.playbackUrl] : []
  const [sourceIndex, setSourceIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSourceIndex(0)
    setFailed(false)
  }, [media.id])

  if (failed || !sources[sourceIndex]) {
    return <div class="max-w-sm rounded-2xl bg-white/10 px-6 py-5 text-center text-sm">動画を再生できませんでした。</div>
  }
  return (
    <video
      key={sources[sourceIndex]}
      class="max-h-full max-w-full"
      src={sources[sourceIndex]}
      poster={twitterImageUrl(media.previewUrl, 'large')}
      controls
      playsInline
      autoPlay
      loop={media.type === 'animated_gif'}
      muted={media.type === 'animated_gif'}
      onError={() => {
        if (sourceIndex + 1 < sources.length) setSourceIndex((index) => index + 1)
        else setFailed(true)
      }}
    >
      動画を再生できません。
    </video>
  )
}
