import type { FunctionComponent } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { routeHref, type AppRoute } from '../router'
import type { ViewerProfile } from '../types'
import { BellIcon, CloseIcon, HomeIcon, SearchIcon, SettingsIcon, UserIcon } from './Icons'

export interface RelayAccount {
  profileName: string
  profile?: ViewerProfile
}

interface NavigationProps {
  accounts: RelayAccount[]
  currentProfile: string
  currentRoute: AppRoute
  drawerOpen: boolean
  chromeHidden: boolean
  onCloseDrawer: () => void
  onOpenDrawer: () => void
  onSelectAccount: (profileName: string) => void
  onSettings: () => void
}

const MENU_ITEMS: { route: AppRoute; label: string; icon: FunctionComponent<{ size?: number }> }[] = [
  { route: { name: 'home' }, label: 'ホーム', icon: HomeIcon },
  { route: { name: 'search', query: '', product: 'top' }, label: '検索', icon: SearchIcon },
  { route: { name: 'notifications', tab: 'all' }, label: '通知', icon: BellIcon },
  { route: { name: 'profile' }, label: 'プロフィール', icon: UserIcon }
]

export function Navigation(props: NavigationProps) {
  return (
    <>
      <aside class="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col px-4 py-3 md:flex" aria-label="サイドメニュー">
        <MenuContent {...props} />
      </aside>
      <MobileDrawer {...props} />
      <nav class={`mobile-bottom-chrome fixed inset-x-0 bottom-0 z-30 mx-auto grid h-[calc(3.5rem+env(safe-area-inset-bottom))] max-w-[600px] grid-cols-4 border-x border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden ${props.chromeHidden ? 'mobile-chrome-hidden' : ''}`} aria-label="メインナビゲーション" inert={props.drawerOpen ? true : undefined}>
        {MENU_ITEMS.slice(0, 3).map((item) => <BottomLink key={item.label} item={item} current={props.currentRoute} />)}
        {props.currentRoute.name === 'profile' ? (
          <button class="grid min-h-12 place-items-center text-primary hover:bg-hover" type="button" onClick={props.onOpenDrawer} aria-label="アカウントとメニューを開く" aria-current="page"><UserIcon size={26} /></button>
        ) : (
          <a class="grid min-h-12 place-items-center text-muted hover:bg-hover hover:text-primary" href={routeHref({ name: 'profile' })} aria-label="プロフィール"><UserIcon size={26} /></a>
        )}
      </nav>
    </>
  )
}

function MenuContent(props: NavigationProps & { mobile?: boolean }) {
  return (
    <>
      <div class="mb-5 flex items-center justify-between">
        <div class="flex min-w-0 gap-2 overflow-x-auto py-1" aria-label="Relayプロフィール">
          {props.accounts.map((account) => (
            <button
              key={account.profileName}
              class={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 bg-subtle text-sm font-bold ${account.profileName === props.currentProfile ? 'border-accent' : 'border-transparent hover:border-muted'}`}
              type="button"
              onClick={() => props.onSelectAccount(account.profileName)}
              aria-label={`${account.profile?.name ?? account.profileName}に切り替え`}
              aria-pressed={account.profileName === props.currentProfile}
            >
              {account.profile?.avatarUrl ? <img class="size-full" src={account.profile.avatarUrl} width="44" height="44" alt="" /> : account.profileName.slice(0, 1).toUpperCase()}
            </button>
          ))}
        </div>
        {props.mobile ? <button class="icon-button shrink-0" type="button" onClick={props.onCloseDrawer} aria-label="メニューを閉じる"><CloseIcon /></button> : null}
      </div>
      <nav class="space-y-1" aria-label="アプリメニュー">
        {MENU_ITEMS.map((item) => (
          <a
            key={item.label}
            class={`flex min-h-13 items-center gap-5 rounded-full px-4 text-xl transition-colors hover:bg-hover ${item.route.name === props.currentRoute.name ? 'font-extrabold text-primary' : 'font-medium text-primary'}`}
            href={routeHref(item.route)}
            onClick={props.onCloseDrawer}
            aria-current={item.route.name === props.currentRoute.name ? 'page' : undefined}
          >
            <item.icon size={27} /><span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div class="mt-auto border-t border-line pt-3">
        <button class="flex min-h-12 w-full items-center gap-4 rounded-full px-4 text-sm font-bold hover:bg-hover" type="button" onClick={props.onSettings}><SettingsIcon /><span>Relay URL設定</span></button>
      </div>
    </>
  )
}

function MobileDrawer(props: NavigationProps) {
  const drawerRef = useRef<HTMLElement>(null)
  const startXRef = useRef(0)

  useEffect(() => {
    if (!props.drawerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') props.onCloseDrawer() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [props.drawerOpen, props.onCloseDrawer])

  return (
    <div class={`fixed inset-0 z-50 md:hidden ${props.drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!props.drawerOpen}>
      <button class={`absolute inset-0 bg-black/45 transition-opacity ${props.drawerOpen ? 'opacity-100' : 'opacity-0'}`} type="button" onClick={props.onCloseDrawer} aria-label="メニューを閉じる" tabIndex={props.drawerOpen ? 0 : -1} />
      <aside
        ref={drawerRef}
        class={`absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col bg-canvas px-4 py-[calc(0.75rem+env(safe-area-inset-top))] shadow-2xl transition-transform ${props.drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="モバイルメニュー"
        inert={props.drawerOpen ? undefined : true}
        tabIndex={-1}
        onTouchStart={(event) => { startXRef.current = event.touches[0]?.clientX ?? 0 }}
        onTouchEnd={(event) => { if ((event.changedTouches[0]?.clientX ?? 0) < startXRef.current - 60) props.onCloseDrawer() }}
      >
        <MenuContent {...props} mobile />
      </aside>
    </div>
  )
}

function BottomLink({ item, current }: { item: (typeof MENU_ITEMS)[number]; current: AppRoute }) {
  const active = item.route.name === current.name
  return <a class={`grid min-h-12 place-items-center hover:bg-hover ${active ? 'text-primary' : 'text-muted'}`} href={routeHref(item.route)} aria-label={item.label} aria-current={active ? 'page' : undefined}><item.icon size={26} /></a>
}
