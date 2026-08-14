import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchConversation, setTweetBookmarked, setTweetLiked, setTweetRetweeted } from '../api/client'
import { RelaySettingsContext } from '../relay-context'
import type { Tweet } from '../types'
import { TweetCard } from './TweetCard'

vi.mock('../api/client', () => ({
  fetchConversation: vi.fn(),
  setTweetBookmarked: vi.fn(),
  setTweetLiked: vi.fn(),
  setTweetRetweeted: vi.fn()
}))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }
const tweet: Tweet = {
  id: '123',
  text: 'hello',
  author: { id: 'u1', name: 'User', handle: 'user', avatarUrl: '', verified: false },
  createdAt: '',
  metrics: { replies: 0, reposts: 2, likes: 3 },
  media: [],
  links: [],
  mentions: [],
  liked: false,
  retweeted: false,
  bookmarked: false,
  url: 'https://x.com/user/status/123'
}

describe('Tweet actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('likes and retweets optimistically, then verifies the state', async () => {
    vi.mocked(setTweetLiked).mockResolvedValue()
    vi.mocked(setTweetRetweeted).mockResolvedValue()
    vi.mocked(setTweetBookmarked).mockResolvedValue()
    vi.mocked(fetchConversation)
      .mockResolvedValueOnce({ focalTweet: { ...tweet, liked: true, metrics: { ...tweet.metrics, likes: 4 } }, ancestors: [], replies: [] })
      .mockResolvedValueOnce({ focalTweet: { ...tweet, retweeted: true, metrics: { ...tweet.metrics, reposts: 3 } }, ancestors: [], replies: [] })
      .mockResolvedValueOnce({ focalTweet: { ...tweet, bookmarked: true }, ancestors: [], replies: [] })
    render(<RelaySettingsContext.Provider value={settings}><TweetCard tweet={tweet} /></RelaySettingsContext.Provider>)

    fireEvent.click(screen.getByRole('button', { name: 'いいね' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'いいねを取り消す' })).toHaveAttribute('aria-pressed', 'true'))
    expect(setTweetLiked).toHaveBeenCalledWith(settings, '123', true)

    fireEvent.click(screen.getByRole('button', { name: 'リツイート' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'リツイートを取り消す' })).toHaveAttribute('aria-pressed', 'true'))
    expect(setTweetRetweeted).toHaveBeenCalledWith(settings, '123', true)

    fireEvent.click(screen.getByRole('button', { name: 'ブックマーク' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'ブックマークを解除' })).toHaveAttribute('aria-pressed', 'true'))
    expect(setTweetBookmarked).toHaveBeenCalledWith(settings, '123', true)
  })

  it('removes an existing like and retweet', async () => {
    const activeTweet = { ...tweet, liked: true, retweeted: true, bookmarked: true }
    vi.mocked(setTweetLiked).mockResolvedValue()
    vi.mocked(setTweetRetweeted).mockResolvedValue()
    vi.mocked(setTweetBookmarked).mockResolvedValue()
    vi.mocked(fetchConversation)
      .mockResolvedValueOnce({ focalTweet: { ...activeTweet, liked: false, metrics: { ...activeTweet.metrics, likes: 2 } }, ancestors: [], replies: [] })
      .mockResolvedValueOnce({ focalTweet: { ...activeTweet, retweeted: false, metrics: { ...activeTweet.metrics, reposts: 1 } }, ancestors: [], replies: [] })
      .mockResolvedValueOnce({ focalTweet: { ...activeTweet, bookmarked: false }, ancestors: [], replies: [] })
    render(<RelaySettingsContext.Provider value={settings}><TweetCard tweet={activeTweet} /></RelaySettingsContext.Provider>)

    fireEvent.click(screen.getByRole('button', { name: 'いいねを取り消す' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'いいね' })).toHaveAttribute('aria-pressed', 'false'))
    expect(setTweetLiked).toHaveBeenCalledWith(settings, '123', false)

    fireEvent.click(screen.getByRole('button', { name: 'リツイートを取り消す' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'リツイート' })).toHaveAttribute('aria-pressed', 'false'))
    expect(setTweetRetweeted).toHaveBeenCalledWith(settings, '123', false)

    fireEvent.click(screen.getByRole('button', { name: 'ブックマークを解除' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'ブックマーク' })).toHaveAttribute('aria-pressed', 'false'))
    expect(setTweetBookmarked).toHaveBeenCalledWith(settings, '123', false)
  })
})
