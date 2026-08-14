import type { ComponentChildren } from 'preact'
import { BackIcon, RefreshIcon, SettingsIcon } from './Icons'

interface AppHeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  onBack?: () => void
  onSettings: () => void
  children?: ComponentChildren
}

export function AppHeader({ title, subtitle, onRefresh, onBack, onSettings, children }: AppHeaderProps) {
  return (
    <header class="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-xl">
      <div class="flex h-14 items-center justify-between px-4">
        <div class="flex min-w-0 items-center gap-2">
          {onBack ? <button class="icon-button -ml-2" type="button" onClick={onBack} aria-label="前の画面に戻る"><BackIcon /></button> : null}
          <div class="min-w-0">
          <h1 class="truncate text-xl font-extrabold tracking-tight">{title}</h1>
          {subtitle ? <p class="truncate text-xs text-muted">{subtitle}</p> : null}
          </div>
        </div>
        <div class="flex items-center gap-1">
          {onRefresh ? (
            <button class="icon-button" type="button" onClick={onRefresh} aria-label="再読み込み"><RefreshIcon /></button>
          ) : null}
          <button class="icon-button" type="button" onClick={onSettings} aria-label="接続設定"><SettingsIcon /></button>
        </div>
      </div>
      {children}
    </header>
  )
}
