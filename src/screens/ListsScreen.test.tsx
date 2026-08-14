import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { fetchTwitterLists } from '../api/client'
import type { TwitterList } from '../types'
import { ListsScreen } from './ListsScreen'

vi.mock('../api/client', () => ({ fetchTwitterLists: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }
const list: TwitterList = { id: 'list-1', name: 'Friends', description: 'People I know', memberCount: 12, subscriberCount: 1, private: true, pinned: false }

describe('ListsScreen', () => {
  it('shows the viewer lists and toggles their Home selection', async () => {
    vi.mocked(fetchTwitterLists).mockResolvedValue({ lists: [list] })
    const onToggle = vi.fn()
    render(<ListsScreen settings={settings} viewerId="viewer-1" selectedLists={[]} onToggle={onToggle} />)

    const button = await screen.findByRole('button', { name: 'Friendsをホームに表示' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('非公開リスト')).toBeInTheDocument()
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledWith(list)
    await waitFor(() => expect(fetchTwitterLists).toHaveBeenCalledWith(settings, 'viewer-1', undefined, expect.any(AbortSignal)))
  })
})
