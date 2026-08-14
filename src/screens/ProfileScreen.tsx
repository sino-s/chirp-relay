import { useCallback, useEffect, useState } from 'preact/hooks'
import { fetchUserLikes, fetchUserMedia, fetchUserProfile, fetchUserTweets, fetchViewer } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { CalendarIcon, LinkIcon, LockIcon, WarningIcon } from '../components/Icons'
import { TimelineFeed } from '../components/TimelineFeed'
import { TweetText } from '../components/TweetText'
import type { RelaySettings, ViewerProfile } from '../types'

type ProfileTab = 'posts' | 'media' | 'likes'

export function ProfileScreen({ settings, userHandle, onBack, refreshToken: externalRefreshToken = 0 }: { settings: RelaySettings; userHandle?: string; onBack?: () => void; refreshToken?: number }) {
  const [profile, setProfile] = useState<ViewerProfile>()
  const [error, setError] = useState<string>()
  const [retryToken, setRetryToken] = useState(0)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [visitedMedia, setVisitedMedia] = useState(false)
  const [visitedLikes, setVisitedLikes] = useState(false)

  useEffect(() => {
    setActiveTab('posts')
    setVisitedMedia(false)
    setVisitedLikes(false)
  }, [settings.baseUrl, settings.profileName, userHandle])

  useEffect(() => {
    const controller = new AbortController()
    setProfile(undefined)
    setError(undefined)
    const request = userHandle ? fetchUserProfile(settings, userHandle, controller.signal) : fetchViewer(settings, controller.signal)
    request.then(setProfile, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : 'プロフィールを読み込めませんでした。')
    })
    return () => controller.abort()
  }, [externalRefreshToken, settings, userHandle, retryToken])

  const loadTweets = useCallback((cursor?: string, signal?: AbortSignal) => {
    if (!profile) return Promise.resolve({ tweets: [] })
    return fetchUserTweets(settings, profile.id, cursor, signal)
  }, [profile, settings])

  const loadMedia = useCallback((cursor?: string, signal?: AbortSignal) => {
    if (!profile) return Promise.resolve({ tweets: [] })
    return fetchUserMedia(settings, profile.id, cursor, signal)
  }, [profile, settings])

  const loadLikes = useCallback((cursor?: string, signal?: AbortSignal) => {
    if (!profile) return Promise.resolve({ tweets: [] })
    return fetchUserLikes(settings, profile.id, cursor, signal)
  }, [profile, settings])

  function changeTab(tab: ProfileTab) {
    setActiveTab(tab)
    if (tab === 'media') setVisitedMedia(true)
    if (tab === 'likes') setVisitedLikes(true)
  }

  function refresh() {
    setProfile(undefined)
    setRetryToken((value) => value + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const headerSubtitle = profile
    ? activeTab === 'likes'
      ? `${profile.likes.toLocaleString('ja-JP')}件のいいね`
      : `${profile.posts.toLocaleString('ja-JP')}件の投稿`
    : undefined

  return (
    <section>
      <AppHeader title={profile?.name ?? 'プロフィール'} subtitle={headerSubtitle} onBack={onBack} />
      {error ? (
        <div class="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
          <WarningIcon class="text-danger" size={30} /><p class="text-sm text-muted">{error}</p>
          <button class="secondary-button" type="button" onClick={refresh}>再試行</button>
        </div>
      ) : profile ? (
        <>
          <ProfileHeader profile={profile} />
          <div class="grid grid-cols-3 border-b border-line" role="tablist" aria-label="プロフィールの投稿種類">
            <ProfileTabButton active={activeTab === 'posts'} onClick={() => changeTab('posts')}>投稿</ProfileTabButton>
            <ProfileTabButton active={activeTab === 'media'} onClick={() => changeTab('media')}>メディア</ProfileTabButton>
            <ProfileTabButton active={activeTab === 'likes'} onClick={() => changeTab('likes')}>いいね</ProfileTabButton>
          </div>
          <div role="tabpanel" hidden={activeTab !== 'posts'}><TimelineFeed loadPage={loadTweets} refreshToken={externalRefreshToken + retryToken} emptyMessage="まだ投稿がありません。" /></div>
          {visitedMedia ? <div role="tabpanel" hidden={activeTab !== 'media'}><TimelineFeed loadPage={loadMedia} refreshToken={externalRefreshToken + retryToken} emptyMessage="メディア付きの投稿はありません。" /></div> : null}
          {visitedLikes ? <div role="tabpanel" hidden={activeTab !== 'likes'}><TimelineFeed loadPage={loadLikes} refreshToken={externalRefreshToken + retryToken} emptyMessage="いいねした投稿はありません。" /></div> : null}
        </>
      ) : <ProfileSkeleton />}
    </section>
  )
}

function ProfileTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button class={`relative h-12 text-sm font-bold transition-colors hover:bg-hover ${active ? 'text-primary' : 'text-muted'}`} type="button" role="tab" aria-selected={active} onClick={onClick}>{children}{active ? <span class="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-accent" /> : null}</button>
}

function ProfileHeader({ profile }: { profile: ViewerProfile }) {
  return (
    <div>
      <div class="aspect-[3/1] bg-subtle">
        {profile.bannerUrl ? <img class="size-full object-cover" src={`${profile.bannerUrl}/600x200`} width="600" height="200" fetchPriority="high" alt="プロフィールのヘッダー画像" /> : null}
      </div>
      <div class="px-4 pb-4">
        <div class="-mt-10 mb-3">
          {profile.avatarUrl ? <img class="size-20 rounded-full border-4 border-canvas bg-subtle" src={profile.avatarUrl.replace('_normal', '_200x200')} width="80" height="80" alt="" /> : <div class="size-20 rounded-full border-4 border-canvas bg-subtle" />}
        </div>
        <h2 class="flex items-center gap-1.5 text-xl font-extrabold leading-6">{profile.name}{profile.protected ? <span class="text-muted" aria-label="非公開アカウント"><LockIcon size={17} /></span> : null}</h2>
        <p class="text-[15px] text-muted">@{profile.handle}</p>
        {profile.description ? <p class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-5.5"><TweetText text={profile.description} links={profile.descriptionLinks} /></p> : null}
        {profile.website ? (
          <a class="tweet-entity-link mt-3 flex w-fit max-w-full items-center gap-1.5 text-sm" href={profile.website.url} target="_blank" rel="noopener noreferrer">
            <LinkIcon class="shrink-0 text-muted" size={18} />
            <span class="truncate">{profile.website.displayUrl}</span>
          </a>
        ) : null}
        {profile.joinedAt ? (
          <p class="mt-3 flex items-center gap-2 text-sm text-muted"><CalendarIcon size={18} />{joinedLabel(profile.joinedAt)}からTwitterを利用しています</p>
        ) : null}
        <div class="mt-3 flex gap-5 text-sm">
          <span><strong>{profile.following.toLocaleString('ja-JP')}</strong> <span class="text-muted">フォロー中</span></span>
          <span><strong>{profile.followers.toLocaleString('ja-JP')}</strong> <span class="text-muted">フォロワー</span></span>
        </div>
      </div>
    </div>
  )
}

function joinedLabel(value: string): string {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(timestamp) : ''
}

function ProfileSkeleton() {
  return (
    <div class="animate-pulse" aria-label="プロフィールを読み込み中" role="status">
      <div class="aspect-[3/1] bg-subtle" />
      <div class="px-4"><div class="-mt-10 size-20 rounded-full border-4 border-canvas bg-subtle" /><div class="mt-3 h-5 w-2/5 rounded bg-subtle" /><div class="mt-2 h-3 w-1/4 rounded bg-subtle" /><div class="mt-5 h-3 w-full rounded bg-subtle" /></div>
    </div>
  )
}
