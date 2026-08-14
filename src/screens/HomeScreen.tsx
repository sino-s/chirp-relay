import { useCallback, useEffect, useState } from 'preact/hooks'
import { fetchListTimeline, fetchTimeline } from '../api/client'
import { TimelineFeed } from '../components/TimelineFeed'
import type { RelaySettings, TimelineKind, TwitterList } from '../types'

type HomeTab = TimelineKind | `list:${string}`

export function HomeScreen({ settings, selectedLists, refreshToken = 0 }: { settings: RelaySettings; selectedLists: TwitterList[]; refreshToken?: number }) {
  const [active, setActive] = useState<HomeTab>('for-you')
  const [visitedFollowing, setVisitedFollowing] = useState(false)
  const [visitedLists, setVisitedLists] = useState<Set<string>>(() => new Set())
  const loadForYou = useCallback((cursor?: string, signal?: AbortSignal) => fetchTimeline(settings, 'for-you', cursor, signal), [settings])
  const loadFollowing = useCallback((cursor?: string, signal?: AbortSignal) => fetchTimeline(settings, 'following', cursor, signal), [settings])

  useEffect(() => {
    const selectedIds = new Set(selectedLists.map((list) => list.id))
    setVisitedLists((current) => new Set([...current].filter((id) => selectedIds.has(id))))
    if (active.startsWith('list:') && !selectedIds.has(active.slice(5))) setActive('for-you')
  }, [selectedLists, active])

  function changeTab(kind: HomeTab) {
    setActive(kind)
    if (kind === 'following') setVisitedFollowing(true)
    if (kind.startsWith('list:')) setVisitedLists((current) => new Set(current).add(kind.slice(5)))
  }

  return (
    <section>
      <h1 class="sr-only">ホーム</h1>
      <header class="mobile-top-chrome sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div class="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="タイムラインの種類">
          <Tab compact={selectedLists.length > 0} active={active === 'for-you'} onClick={() => changeTab('for-you')}>おすすめ</Tab>
          <Tab compact={selectedLists.length > 0} active={active === 'following'} onClick={() => changeTab('following')}>フォロー中</Tab>
          {selectedLists.map((list) => (
            <Tab compact key={list.id} active={active === `list:${list.id}`} onClick={() => changeTab(`list:${list.id}`)}>{list.name}</Tab>
          ))}
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
      {selectedLists.filter((list) => visitedLists.has(list.id)).map((list) => (
        <div key={list.id} role="tabpanel" hidden={active !== `list:${list.id}`}>
          <ListTimelinePanel settings={settings} list={list} refreshToken={refreshToken} />
        </div>
      ))}
    </section>
  )
}

function ListTimelinePanel({ settings, list, refreshToken }: { settings: RelaySettings; list: TwitterList; refreshToken: number }) {
  const loadPage = useCallback((cursor?: string, signal?: AbortSignal) => fetchListTimeline(settings, list.id, cursor, signal), [settings, list.id])
  return <TimelineFeed loadPage={loadPage} refreshToken={refreshToken} emptyMessage="このリストにはまだポストがありません" />
}

function Tab({ active, compact = false, onClick, children }: { active: boolean; compact?: boolean; onClick: () => void; children: string }) {
  return (
    <button
      class={`relative h-12 shrink-0 px-3 text-sm font-bold transition-colors hover:bg-hover ${compact ? 'min-w-1/3 max-w-40' : 'min-w-1/2 max-w-48'} ${active ? 'text-primary' : 'text-muted'}`}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      <span class="block truncate">{children}</span>
      {active ? <span class="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-accent" /> : null}
    </button>
  )
}
