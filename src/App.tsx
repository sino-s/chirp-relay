import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { fetchViewer, probeRelay } from './api/client'
import { Navigation, type RelayAccount } from './components/Navigation'
import { ComposeButton, Composer } from './components/Composer'
import { PullToRefresh } from './components/PullToRefresh'
import { SettingsScreen } from './components/SettingsScreen'
import { ensureAppHistoryEntry, markAppHistoryEntry, navigate, parseHash, routeScrollKey, type AppRoute } from './router'
import { HomeScreen } from './screens/HomeScreen'
import { ListsScreen } from './screens/ListsScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SearchScreen } from './screens/SearchScreen'
import { TweetScreen } from './screens/TweetScreen'
import { loadSettings, saveSettings } from './settings'
import { loadSelectedLists, saveSelectedLists } from './list-preferences'
import { RelaySettingsContext } from './relay-context'
import type { RelaySettings, TwitterList } from './types'

export function App() {
  const [settings, setSettings] = useState<RelaySettings | undefined>(() => loadSettings())
  const [route, setRoute] = useState<AppRoute>(parseHash)
  const [profileVisited, setProfileVisited] = useState(parseHash().name === 'profile')
  const [notificationsVisited, setNotificationsVisited] = useState(parseHash().name === 'notifications')
  const [listsVisited, setListsVisited] = useState(parseHash().name === 'lists')
  const [selectedLists, setSelectedLists] = useState<TwitterList[]>(() => settings ? loadSelectedLists(settings) : [])
  const [editingSettings, setEditingSettings] = useState(false)
  const [accounts, setAccounts] = useState<RelayAccount[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [chromeHidden, setChromeHidden] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const routeRef = useRef(route)
  const historyIndexRef = useRef(0)
  const scrollPositionsRef = useRef(new Map<string, number>())
  const drawerOpenRef = useRef(false)

  useEffect(() => { drawerOpenRef.current = drawerOpen }, [drawerOpen])

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
      if (next.name === 'notifications') setNotificationsVisited(true)
      if (next.name === 'lists') setListsVisited(true)
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

  useEffect(() => {
    if (!settings) return
    const controller = new AbortController()
    probeRelay(settings.baseUrl, controller.signal).then(async (profileNames) => {
      if (!profileNames.includes(settings.profileName) && profileNames[0]) {
        const next = { ...settings, profileName: profileNames[0] }
        saveSettings(next)
        setSettings(next)
        return
      }
      setAccounts(profileNames.map((profileName) => ({ profileName })))
      const profiles = await Promise.all(profileNames.map(async (profileName): Promise<RelayAccount> => {
        try {
          const profile = await fetchViewer({ baseUrl: settings.baseUrl, profileName }, controller.signal)
          return { profileName, profile }
        } catch (reason) {
          if (reason instanceof DOMException && reason.name === 'AbortError') throw reason
          return { profileName }
        }
      }))
      setAccounts(profiles)
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setAccounts([{ profileName: settings.profileName }])
    })
    return () => controller.abort()
  }, [settings])

  useEffect(() => {
    if (settings) setSelectedLists(loadSelectedLists(settings))
  }, [settings?.baseUrl, settings?.profileName])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastY
      if (currentY < 56 || delta < -8) setChromeHidden(false)
      else if (delta > 8 && currentY > 96) setChromeHidden(true)
      lastY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let startX = 0
    let startY = 0
    let tracking = false
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch || (!drawerOpenRef.current && touch.clientX > 24)) return
      startX = touch.clientX
      startY = touch.clientY
      tracking = true
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const touch = event.changedTouches[0]
      if (!touch) return
      const deltaX = touch.clientX - startX
      const deltaY = Math.abs(touch.clientY - startY)
      if (!drawerOpenRef.current && deltaX > 64 && deltaY < deltaX) setDrawerOpen(true)
      if (drawerOpenRef.current && deltaX < -64 && deltaY < Math.abs(deltaX)) setDrawerOpen(false)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || !drawerOpenRef.current) return
      const touch = event.touches[0]
      if (!touch) return
      const deltaX = touch.clientX - startX
      if (deltaX < -64 && Math.abs(touch.clientY - startY) < Math.abs(deltaX)) {
        tracking = false
        setDrawerOpen(false)
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function applySettings(next: RelaySettings) {
    saveSettings(next)
    setSelectedLists(loadSelectedLists(next))
    setAccounts([])
    setSettings(next)
    setEditingSettings(false)
  }

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const closeComposer = useCallback(() => setComposerOpen(false), [])

  function selectAccount(profileName: string) {
    if (!settings || profileName === settings.profileName) {
      closeDrawer()
      return
    }
    const next = { ...settings, profileName }
    saveSettings(next)
    setSelectedLists(loadSelectedLists(next))
    setSettings(next)
    setRefreshToken((value) => value + 1)
    scrollPositionsRef.current.clear()
    window.scrollTo(0, 0)
    closeDrawer()
  }

  if (!settings) return <SettingsScreen onSave={applySettings} />
  if (editingSettings) return <SettingsScreen initial={settings} onSave={applySettings} onCancel={() => setEditingSettings(false)} />

  const currentAccount = accounts.find((account) => account.profileName === settings.profileName)
  const notificationTab = route.name === 'notifications' ? route.tab : 'all'
  const activeSettings = settings

  function toggleList(list: TwitterList) {
    setSelectedLists((current) => {
      const next = current.some((item) => item.id === list.id)
        ? current.filter((item) => item.id !== list.id)
        : [...current, list]
      saveSelectedLists(activeSettings, next)
      return next
    })
  }

  return (
    <RelaySettingsContext.Provider value={settings}>
    <div class={`mx-auto flex min-h-dvh w-full max-w-[860px] ${chromeHidden ? 'chrome-hidden' : ''}`} inert={composerOpen ? true : undefined}>
      <button class="skip-link" type="button" onClick={() => document.getElementById('main-content')?.focus()}>メインコンテンツへ移動</button>
      <Navigation accounts={accounts} currentProfile={settings.profileName} currentRoute={route} drawerOpen={drawerOpen} chromeHidden={chromeHidden} onCloseDrawer={closeDrawer} onOpenDrawer={() => setDrawerOpen(true)} onSelectAccount={selectAccount} onSettings={() => { closeDrawer(); setEditingSettings(true) }} />
      <div class="min-h-dvh w-full max-w-[600px] border-x border-line bg-canvas pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0" inert={drawerOpen ? true : undefined}>
        <PullToRefresh onRefresh={() => { setChromeHidden(false); setRefreshToken((value) => value + 1); window.scrollTo(0, 0) }}>
          <main id="main-content" tabIndex={-1}>
            <div hidden={route.name !== 'home'}><HomeScreen settings={settings} selectedLists={selectedLists} refreshToken={refreshToken} /></div>
            {profileVisited ? <div hidden={route.name !== 'profile'}><ProfileScreen settings={settings} refreshToken={refreshToken} /></div> : null}
            {route.name === 'user' ? <ProfileScreen key={`${route.handle}:${refreshToken}`} settings={settings} userHandle={route.handle} onBack={() => goBack()} /> : null}
            {route.name === 'tweet' ? <TweetScreen key={`${route.tweetId}:${refreshToken}`} settings={settings} tweetId={route.tweetId} media={route.media} /> : null}
            {notificationsVisited ? <div hidden={route.name !== 'notifications'}><NotificationsScreen settings={settings} tab={notificationTab} refreshToken={refreshToken} /></div> : null}
            {listsVisited ? <div hidden={route.name !== 'lists'}><ListsScreen settings={settings} viewerId={currentAccount?.profile?.id} selectedLists={selectedLists} onToggle={toggleList} refreshToken={refreshToken} /></div> : null}
            {route.name === 'search' ? <SearchScreen key={`${route.query}:${route.product}:${refreshToken}`} settings={settings} query={route.query} product={route.product} /> : null}
          </main>
        </PullToRefresh>
      </div>
      <ComposeButton onClick={() => { closeDrawer(); setComposerOpen(true) }} />
    </div>
    {composerOpen ? <Composer settings={settings} profile={currentAccount?.profile} onClose={closeComposer} onPosted={() => {
      closeComposer()
      setChromeHidden(false)
      setRefreshToken((value) => value + 1)
      navigate({ name: 'home' })
      window.scrollTo(0, 0)
    }} /> : null}
    </RelaySettingsContext.Provider>
  )
}

function goBack() {
  if (window.history.length > 1) window.history.back()
  else navigate({ name: 'home' }, true)
}
