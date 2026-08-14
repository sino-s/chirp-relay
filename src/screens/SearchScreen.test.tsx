import { fireEvent, render, screen } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchTwitter } from '../api/client'
import { addSearchHistory, loadSearchHistory } from '../search-history'
import { SearchScreen } from './SearchScreen'

vi.mock('../api/client', () => ({ searchTwitter: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }

describe('SearchScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '#/search?tab=top')
    vi.mocked(searchTwitter).mockResolvedValue({ tweets: [], users: [] })
  })

  it('shows recent searches and opens one immediately', () => {
    addSearchHistory(settings, 'first query')
    addSearchHistory(settings, 'second query')
    render(<SearchScreen settings={settings} query="" product="top" />)

    expect(screen.getByRole('heading', { name: '最近の検索' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /first query/ }))

    expect(window.location.hash).toBe('#/search?q=first+query&tab=top')
    expect(loadSearchHistory(settings)).toEqual(['first query', 'second query'])
  })

  it('clears all recent searches for the current profile', () => {
    addSearchHistory(settings, 'query')
    render(<SearchScreen settings={settings} query="" product="top" />)

    fireEvent.click(screen.getByRole('button', { name: 'すべて消去' }))

    expect(loadSearchHistory(settings)).toEqual([])
    expect(screen.getByRole('heading', { name: '検索する' })).toBeInTheDocument()
  })
})
