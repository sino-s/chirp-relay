import { useCallback, useEffect, useState } from 'preact/hooks'
import { fetchUserTweets, fetchViewer } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { CalendarIcon, WarningIcon } from '../components/Icons'
import { TimelineFeed } from '../components/TimelineFeed'
import type { RelaySettings, ViewerProfile } from '../types'

export function ProfileScreen({ settings, onSettings }: { settings: RelaySettings; onSettings: () => void }) {
  const [profile, setProfile] = useState<ViewerProfile>()
  const [error, setError] = useState<string>()
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setError(undefined)
    fetchViewer(settings, controller.signal).then(setProfile, (reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(reason instanceof Error ? reason.message : 'プロフィールを読み込めませんでした。')
    })
    return () => controller.abort()
  }, [settings, refreshToken])

  const loadTweets = useCallback((cursor?: string, signal?: AbortSignal) => {
    if (!profile) return Promise.resolve({ tweets: [] })
    return fetchUserTweets(settings, profile.id, cursor, signal)
  }, [profile, settings])

  function refresh() {
    setProfile(undefined)
    setRefreshToken((value) => value + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section>
      <AppHeader title={profile?.name ?? 'プロフィール'} subtitle={profile ? `${profile.posts.toLocaleString('ja-JP')}件の投稿` : undefined} onRefresh={refresh} onSettings={onSettings} />
      {error ? (
        <div class="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
          <WarningIcon class="text-danger" size={30} /><p class="text-sm text-muted">{error}</p>
          <button class="secondary-button" type="button" onClick={refresh}>再試行</button>
        </div>
      ) : profile ? (
        <>
          <ProfileHeader profile={profile} />
          <div class="border-b border-line px-4 pt-4"><h2 class="inline-block border-b-4 border-accent px-2 pb-3 text-sm font-bold">投稿</h2></div>
          <TimelineFeed loadPage={loadTweets} refreshToken={refreshToken} emptyMessage="まだ投稿がありません。" />
        </>
      ) : <ProfileSkeleton />}
    </section>
  )
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
        <h2 class="text-xl font-extrabold leading-6">{profile.name}</h2>
        <p class="text-[15px] text-muted">@{profile.handle}</p>
        {profile.description ? <p class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-5.5">{profile.description}</p> : null}
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
