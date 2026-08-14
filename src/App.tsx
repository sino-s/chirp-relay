import type { ComponentChildren } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { BellIcon, HomeIcon, SearchIcon, UserIcon } from './components/Icons'
import { SettingsScreen } from './components/SettingsScreen'
import { ensureAppHistoryEntry, markAppHistoryEntry, navigate, parseHash, routeHref, routeScrollKey, type AppRoute } from './router'
import { HomeScreen } from './screens/HomeScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SearchScreen } from './screens/SearchScreen'
import { TweetScreen } from './screens/TweetScreen'
import { loadSettings, saveSettings } from './settings'
import type { RelaySettings } from './types'

export function App() {
  const [settings, setSettings] = useState<RelaySettings | undefined>(() => loadSettings())
  const [route, setRoute] = useState<AppRoute>(parseHash)
  const [profileVisited, setProfileVisited] = useState(parseHash().name === 'profile')
  const [editingSettings, setEditingSettings] = useState(false)
  const routeRef = useRef(route)
  const historyIndexRef = useRef(0)
  const scrollPositionsRef = useRef(new Map<string, number>())

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(window.history.state, '', '#/home')
    historyIndexRef.current = ensureAppHistoryEntry()
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const onHashChange = () => {
      scrollPositionsRef.current.set(routeScrollKey(routeRef.current), window.scrollY)
      const next = parseHash()
      historyIndexRef.current = markAppHistoryEntry(historyIndexRef.current)
      routeRef.current = next
      setRoute(next)
      if (next.name === 'profile') setProfileVisited(true)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.history.scrollRestoration = previousScrollRestoration
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  useLayoutEffect(() => {
    const top = scrollPositionsRef.current.get(routeScrollKey(route)) ?? 0
    let innerFrame = 0
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => window.scrollTo(0, top))
    })
    return () => {
      window.cancelAnimationFrame(outerFrame)
      window.cancelAnimationFrame(innerFrame)
    }
  }, [route])

  function applySettings(next: RelaySettings) {
    saveSettings(next)
    setSettings(next)
    setEditingSettings(false)
  }

  if (!settings) return <SettingsScreen onSave={applySettings} />
  if (editingSettings) return <SettingsScreen initial={settings} onSave={applySettings} onCancel={() => setEditingSettings(false)} />

  return (
    <div class="mx-auto min-h-dvh w-full max-w-[600px] border-x border-line bg-canvas pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button class="skip-link" type="button" onClick={() => document.getElementById('main-content')?.focus()}>メインコンテンツへ移動</button>
      <main id="main-content" tabIndex={-1}>
        <div hidden={route.name !== 'home'}><HomeScreen settings={settings} onSettings={() => setEditingSettings(true)} /></div>
        {profileVisited ? <div hidden={route.name !== 'profile'}><ProfileScreen settings={settings} onSettings={() => setEditingSettings(true)} /></div> : null}
        {route.name === 'user' ? <ProfileScreen settings={settings} userHandle={route.handle} onBack={() => goBack()} onSettings={() => setEditingSettings(true)} /> : null}
        {route.name === 'tweet' ? <TweetScreen settings={settings} tweetId={route.tweetId} media={route.media} onSettings={() => setEditingSettings(true)} /> : null}
        {route.name === 'notifications' ? <NotificationsScreen settings={settings} tab={route.tab} onSettings={() => setEditingSettings(true)} /> : null}
        {route.name === 'search' ? <SearchScreen settings={settings} query={route.query} product={route.product} onSettings={() => setEditingSettings(true)} /> : null}
      </main>
      <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto grid h-[calc(4rem+env(safe-area-inset-bottom))] max-w-[600px] grid-cols-4 border-x border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl" aria-label="メインナビゲーション">
        <NavLink route={{ name: 'home' }} current={route} label="ホーム"><HomeIcon size={25} /></NavLink>
        <NavLink route={{ name: 'search', query: '', product: 'top' }} current={route} label="検索"><SearchIcon size={25} /></NavLink>
        <NavLink route={{ name: 'notifications', tab: 'all' }} current={route} label="通知"><BellIcon size={25} /></NavLink>
        <NavLink route={{ name: 'profile' }} current={route} label="プロフィール"><UserIcon size={25} /></NavLink>
      </nav>
    </div>
  )
}

function goBack() {
  if (window.history.length > 1) window.history.back()
  else navigate({ name: 'home' }, true)
}

function NavLink({ route, current, label, children }: { route: AppRoute; current: AppRoute; label: string; children: ComponentChildren }) {
  return (
    <a class={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors hover:bg-hover ${route.name === current.name ? 'text-primary' : 'text-muted'}`} href={routeHref(route)} aria-current={route.name === current.name ? 'page' : undefined}>
      {children}<span>{label}</span>
    </a>
  )
}
