import { render, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { fetchBookmarks } from '../api/client'
import { BookmarksScreen } from './BookmarksScreen'

vi.mock('../api/client', () => ({ fetchBookmarks: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }

describe('BookmarksScreen', () => {
  it('loads the bookmark timeline', async () => {
    vi.mocked(fetchBookmarks).mockResolvedValue({ tweets: [] })
    const { getByRole, getByText } = render(<BookmarksScreen settings={settings} />)

    expect(getByRole('heading', { name: 'ブックマーク' })).toBeInTheDocument()
    await waitFor(() => expect(fetchBookmarks).toHaveBeenCalledWith(settings, undefined, expect.any(AbortSignal)))
    expect(getByText('ブックマークした投稿はありません。')).toBeInTheDocument()
  })
})
