import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { fetchListTimeline, fetchTimeline } from '../api/client'
import type { TwitterList } from '../types'
import { HomeScreen } from './HomeScreen'

vi.mock('../api/client', () => ({ fetchTimeline: vi.fn(), fetchListTimeline: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }
const list: TwitterList = { id: 'list-1', name: '長い名前のリスト', description: '', memberCount: 2, subscriberCount: 0, private: false, pinned: false }

describe('HomeScreen', () => {
  it('loads a selected list lazily and retains it across tab switches', async () => {
    vi.mocked(fetchTimeline).mockResolvedValue({ tweets: [] })
    vi.mocked(fetchListTimeline).mockResolvedValue({ tweets: [] })
    render(<HomeScreen settings={settings} selectedLists={[list]} />)

    expect(screen.getByRole('tab', { name: list.name })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'おすすめ' })).toHaveClass('min-w-1/3')
    expect(screen.getByRole('tab', { name: 'フォロー中' })).toHaveClass('min-w-1/3')
    expect(screen.getByRole('tab', { name: list.name })).toHaveClass('min-w-1/3')
    expect(fetchListTimeline).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: list.name }))
    await waitFor(() => expect(fetchListTimeline).toHaveBeenCalledWith(settings, list.id, undefined, expect.any(AbortSignal)))

    fireEvent.click(screen.getByRole('tab', { name: 'フォロー中' }))
    await waitFor(() => expect(fetchTimeline).toHaveBeenCalledWith(settings, 'following', undefined, expect.any(AbortSignal)))
    fireEvent.click(screen.getByRole('tab', { name: list.name }))
    expect(fetchListTimeline).toHaveBeenCalledTimes(1)
  })
})
