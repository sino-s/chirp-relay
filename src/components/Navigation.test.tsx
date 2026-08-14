import { fireEvent, render, screen, within } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { Navigation } from './Navigation'

const accounts = [
  { profileName: 'one', profile: { id: '1', name: 'One', handle: 'one', description: '', avatarUrl: 'https://img.example/one.jpg', followers: 0, following: 0, posts: 0 } },
  { profileName: 'two', profile: { id: '2', name: 'Two', handle: 'two', description: '', avatarUrl: 'https://img.example/two.jpg', followers: 0, following: 0, posts: 0 } }
]

describe('Navigation', () => {
  it('shows all relay accounts and switches from their avatar buttons', () => {
    const onSelectAccount = vi.fn()
    render(<Navigation accounts={accounts} currentProfile="one" currentRoute={{ name: 'home' }} drawerOpen chromeHidden={false} onCloseDrawer={() => undefined} onOpenDrawer={() => undefined} onSelectAccount={onSelectAccount} onSettings={() => undefined} />)
    expect(screen.getAllByRole('button', { name: 'Oneに切り替え' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Twoに切り替え' })[0]!)
    expect(onSelectAccount).toHaveBeenCalledWith('two')
  })

  it('keeps the mobile bottom navigation icon-only', () => {
    render(<Navigation accounts={accounts} currentProfile="one" currentRoute={{ name: 'home' }} drawerOpen={false} chromeHidden={false} onCloseDrawer={() => undefined} onOpenDrawer={() => undefined} onSelectAccount={() => undefined} onSettings={() => undefined} />)
    const navigation = screen.getByRole('navigation', { name: 'メインナビゲーション' })
    expect(navigation.textContent).toBe('')
    expect(within(navigation).getByRole('link', { name: 'ホーム' })).toHaveAttribute('href', '#/home')
    expect(within(navigation).getByRole('link', { name: 'プロフィール' })).toHaveAttribute('href', '#/profile')
  })

  it('includes lists in the side menu', () => {
    render(<Navigation accounts={accounts} currentProfile="one" currentRoute={{ name: 'home' }} drawerOpen chromeHidden={false} onCloseDrawer={() => undefined} onOpenDrawer={() => undefined} onSelectAccount={() => undefined} onSettings={() => undefined} />)
    expect(screen.getAllByRole('link', { name: 'リスト' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'リスト' })[0]).toHaveAttribute('href', '#/lists')
  })

  it('opens the drawer from the bottom profile icon when already on the profile screen', () => {
    const onOpenDrawer = vi.fn()
    render(<Navigation accounts={accounts} currentProfile="one" currentRoute={{ name: 'profile' }} drawerOpen={false} chromeHidden={false} onCloseDrawer={() => undefined} onOpenDrawer={onOpenDrawer} onSelectAccount={() => undefined} onSettings={() => undefined} />)
    const navigation = screen.getByRole('navigation', { name: 'メインナビゲーション' })

    fireEvent.click(within(navigation).getByRole('button', { name: 'アカウントとメニューを開く' }))

    expect(onOpenDrawer).toHaveBeenCalledOnce()
  })
})
