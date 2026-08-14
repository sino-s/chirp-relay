import { useCallback, useState } from 'preact/hooks'
import { fetchTimeline } from '../api/client'
import { TimelineFeed } from '../components/TimelineFeed'
import type { RelaySettings, TimelineKind } from '../types'

export function HomeScreen({ settings, refreshToken = 0 }: { settings: RelaySettings; refreshToken?: number }) {
  const [active, setActive] = useState<TimelineKind>('for-you')
  const [visitedFollowing, setVisitedFollowing] = useState(false)
  const loadForYou = useCallback((cursor?: string, signal?: AbortSignal) => fetchTimeline(settings, 'for-you', cursor, signal), [settings])
  const loadFollowing = useCallback((cursor?: string, signal?: AbortSignal) => fetchTimeline(settings, 'following', cursor, signal), [settings])

  function changeTab(kind: TimelineKind) {
    setActive(kind)
    if (kind === 'following') setVisitedFollowing(true)
  }

  return (
    <section>
      <h1 class="sr-only">ホーム</h1>
      <header class="mobile-top-chrome sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div class="grid grid-cols-2" role="tablist" aria-label="タイムラインの種類">
          <Tab active={active === 'for-you'} onClick={() => changeTab('for-you')}>おすすめ</Tab>
          <Tab active={active === 'following'} onClick={() => changeTab('following')}>フォロー中</Tab>
        </div>
      </header>
      <div role="tabpanel" hidden={active !== 'for-you'}>
        <TimelineFeed loadPage={loadForYou} refreshToken={refreshToken} />
      </div>
      {visitedFollowing ? (
        <div role="tabpanel" hidden={active !== 'following'}>
          <TimelineFeed loadPage={loadFollowing} refreshToken={refreshToken} />
        </div>
      ) : null}
    </section>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      class={`relative h-12 text-sm font-bold transition-colors hover:bg-hover ${active ? 'text-primary' : 'text-muted'}`}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {children}
      {active ? <span class="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-accent" /> : null}
    </button>
  )
}
