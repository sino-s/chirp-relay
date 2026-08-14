import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { fetchUserLikes, fetchUserMedia, fetchUserTweets, fetchViewer } from '../api/client'
import { ProfileScreen } from './ProfileScreen'

vi.mock('../api/client', () => ({
  fetchUserLikes: vi.fn(),
  fetchUserMedia: vi.fn(),
  fetchUserProfile: vi.fn(),
  fetchUserTweets: vi.fn(),
  fetchViewer: vi.fn()
}))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }
const profile = { id: 'user-1', name: 'User', handle: 'user', description: 'Bio https://t.co/bio', descriptionLinks: [{ url: 'https://t.co/bio', expandedUrl: 'https://example.com/bio', displayUrl: 'example.com/bio' }], avatarUrl: '', followers: 0, following: 0, posts: 12, likes: 1234, website: { url: 'https://example.com/about', displayUrl: 'example.com/about' } }

describe('ProfileScreen', () => {
  it('loads media and likes lazily and keeps all profile tabs mounted', async () => {
    vi.mocked(fetchViewer).mockResolvedValue(profile)
    vi.mocked(fetchUserTweets).mockResolvedValue({ tweets: [] })
    vi.mocked(fetchUserMedia).mockResolvedValue({ tweets: [] })
    vi.mocked(fetchUserLikes).mockResolvedValue({ tweets: [] })
    render(<ProfileScreen settings={settings} />)
    await waitFor(() => expect(fetchUserTweets).toHaveBeenCalledOnce())
    expect(screen.getByRole('link', { name: 'example.com/about' })).toHaveAttribute('href', 'https://example.com/about')
    expect(screen.getByRole('link', { name: 'example.com/bio' })).toHaveAttribute('href', 'https://example.com/bio')
    expect(screen.getByText('12件の投稿')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'メディア' }))
    await waitFor(() => expect(fetchUserMedia).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('tab', { name: 'いいね' }))
    await waitFor(() => expect(fetchUserLikes).toHaveBeenCalledOnce())
    expect(screen.getByText('1,234件のいいね')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: '投稿' }))
    expect(screen.getByText('12件の投稿')).toBeInTheDocument()

    expect(fetchUserTweets).toHaveBeenCalledOnce()
    expect(fetchUserMedia).toHaveBeenCalledOnce()
    expect(fetchUserLikes).toHaveBeenCalledOnce()
  })
})
