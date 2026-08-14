import { fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tweet } from '../types'
import { MediaViewer } from './MediaViewer'

const tweet: Tweet = {
  id: '123',
  text: 'photo',
  author: { id: 'u1', name: 'User', handle: 'user', avatarUrl: '', verified: false },
  createdAt: '',
  metrics: { replies: 0, reposts: 0, likes: 0 },
  media: [{ id: 'm1', type: 'photo', previewUrl: 'https://img.example/photo.jpg' }],
  links: [],
  url: 'https://x.com/user/status/123'
}

const videoTweet: Tweet = {
  ...tweet,
  media: [{
    id: 'v1',
    type: 'video',
    previewUrl: 'https://img.example/video.jpg',
    playbackUrl: 'https://video.example/high.mp4',
    playbackUrls: ['https://video.example/high.mp4', 'https://video.example/low.mp4']
  }]
}

describe('MediaViewer', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    window.history.replaceState(null, '', '#/tweet/123?media=0')
  })

  afterEach(() => vi.restoreAllMocks())

  it('removes the media parameter when the close button is pressed', () => {
    render(<MediaViewer tweet={tweet} initialIndex={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'メディアを閉じる' }))
    expect(window.location.hash).toBe('#/tweet/123')
  })

  it('closes with Escape', () => {
    render(<MediaViewer tweet={tweet} initialIndex={0} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(window.location.hash).toBe('#/tweet/123')
  })

  it('returns to the previous app screen when media was opened from one', () => {
    window.history.replaceState({ chirpHistoryIndex: 1 }, '', '#/tweet/123?media=0')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    render(<MediaViewer tweet={tweet} initialIndex={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'メディアを閉じる' }))
    expect(back).toHaveBeenCalledOnce()
  })

  it('falls back to the next MP4 source after a playback error', () => {
    render(<MediaViewer tweet={videoTweet} initialIndex={0} />)
    const firstVideo = document.querySelector('video')
    expect(firstVideo).toHaveAttribute('src', 'https://video.example/high.mp4')
    fireEvent.error(firstVideo!)
    expect(document.querySelector('video')).toHaveAttribute('src', 'https://video.example/low.mp4')
  })
})
