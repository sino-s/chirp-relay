import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import type { Tweet } from '../types'
import { TweetCard } from './TweetCard'

function makeTweet(overrides: Partial<Tweet> = {}): Tweet {
  return {
    id: '123',
    text: 'plain text',
    author: { id: 'u1', name: 'User', handle: 'user', avatarUrl: '', verified: false },
    createdAt: 'Fri Aug 14 10:00:00 +0000 2026',
    metrics: { replies: 1, reposts: 2, likes: 3 },
    media: [],
    links: [],
    url: 'https://x.com/user/status/123',
    ...overrides
  }
}

describe('TweetCard', () => {
  it('uses a full-card detail link without wrapping plain text in another link', () => {
    render(<TweetCard tweet={makeTweet()} />)
    expect(screen.getByRole('link', { name: 'Userの投稿を表示' })).toHaveAttribute('href', '#/tweet/123')
    expect(screen.getByText('plain text').closest('a')).toBeNull()
  })

  it('keeps media and hashtag destinations above the detail link', () => {
    render(<TweetCard tweet={makeTweet({
      text: '#photo',
      media: [{ id: 'm1', type: 'photo', previewUrl: 'https://img.example/photo.jpg' }]
    })} />)
    expect(screen.getByRole('link', { name: '#photo' })).toHaveAttribute('href', '#/search?q=%23photo&tab=top')
    expect(screen.getByRole('link', { name: '画像 1 を拡大表示' })).toHaveAttribute('href', '#/tweet/123?media=0')
    expect(screen.getByRole('img', { name: '投稿画像 1' })).toHaveAttribute('src', 'https://img.example/photo.jpg?name=small')
  })

  it('marks protected authors and renders a URL preview', () => {
    render(<TweetCard tweet={makeTweet({
      author: { id: 'u1', name: 'Private User', handle: 'private', avatarUrl: '', verified: false, protected: true },
      linkPreview: {
        url: 'https://example.com/article',
        title: 'Article title',
        domain: 'example.com',
        description: 'Article description',
        imageUrl: 'https://pbs.twimg.com/card.jpg'
      }
    })} />)

    expect(screen.getByLabelText('非公開アカウント')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Article titleを開く' })).toHaveAttribute('href', 'https://example.com/article')
    expect(screen.getByRole('img', { name: '' })).toHaveAttribute('src', 'https://pbs.twimg.com/card.jpg?name=small')
  })
})
