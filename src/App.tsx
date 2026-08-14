import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { HomeIcon, UserIcon } from './components/Icons'
import { SettingsScreen } from './components/SettingsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { loadSettings, saveSettings } from './settings'
import type { RelaySettings } from './types'

type Route = 'home' | 'profile'

function currentRoute(): Route {
  return window.location.hash === '#/profile' ? 'profile' : 'home'
}

export function App() {
  const [settings, setSettings] = useState<RelaySettings | undefined>(() => loadSettings())
  const [route, setRoute] = useState<Route>(currentRoute)
  const [profileVisited, setProfileVisited] = useState(currentRoute() === 'profile')
  const [editingSettings, setEditingSettings] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      const next = currentRoute()
      setRoute(next)
      if (next === 'profile') setProfileVisited(true)
    }
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) window.history.replaceState(null, '', '#/home')
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

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
        <div hidden={route !== 'home'}><HomeScreen settings={settings} onSettings={() => setEditingSettings(true)} /></div>
        {profileVisited ? <div hidden={route !== 'profile'}><ProfileScreen settings={settings} onSettings={() => setEditingSettings(true)} /></div> : null}
      </main>
      <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto grid h-[calc(4rem+env(safe-area-inset-bottom))] max-w-[600px] grid-cols-2 border-x border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl" aria-label="メインナビゲーション">
        <NavLink route="home" current={route} label="ホーム"><HomeIcon size={25} /></NavLink>
        <NavLink route="profile" current={route} label="プロフィール"><UserIcon size={25} /></NavLink>
      </nav>
    </div>
  )
}

function NavLink({ route, current, label, children }: { route: Route; current: Route; label: string; children: ComponentChildren }) {
  return (
    <a class={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors hover:bg-hover ${route === current ? 'text-primary' : 'text-muted'}`} href={`#/${route}`} aria-current={route === current ? 'page' : undefined}>
      {children}<span>{label}</span>
    </a>
  )
}
