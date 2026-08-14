import { describe, expect, it } from 'vitest'
import { parseTimeline, parseViewer } from './parser'

function user(id: string, handle: string, name: string) {
  return {
    rest_id: id,
    core: { screen_name: handle, name },
    avatar: { image_url: `https://img.example/${handle}.jpg` },
    legacy: {}
  }
}

function tweet(id: string, text: string) {
  return {
    __typename: 'Tweet',
    rest_id: id,
    core: { user_results: { result: user(`u-${id}`, `user${id}`, `User ${id}`) } },
    legacy: {
      full_text: text,
      created_at: 'Fri Aug 14 10:00:00 +0000 2026',
      reply_count: 1,
      retweet_count: 2,
      favorite_count: 3,
      entities: { urls: [] }
    },
    views: { count: '42' }
  }
}

describe('parseTimeline', () => {
  it('extracts tweet entries, skips promotions and deduplicates', () => {
    const value = {
      entries: [
        { entryId: 'tweet-1', content: { itemContent: { tweet_results: { result: tweet('1', 'hello') } } } },
        { entryId: 'tweet-1-copy', content: { itemContent: { tweet_results: { result: tweet('1', 'hello') } } } },
        { entryId: 'promoted-tweet-2', content: { itemContent: { tweet_results: { result: tweet('2', 'ad') } } } },
        { entryId: 'cursor-bottom', content: { value: 'next-page', cursorType: 'Bottom' } }
      ]
    }
    const page = parseTimeline(value)
    expect(page.tweets).toHaveLength(1)
    expect(page.tweets[0]).toMatchObject({ id: '1', text: 'hello', metrics: { views: 42 } })
    expect(page.nextCursor).toBe('next-page')
  })

  it('unwraps reposts, quotes and chooses the highest bitrate MP4', () => {
    const original = tweet('10', 'video https://t.co/media')
    original.legacy = {
      ...original.legacy,
      extended_entities: { media: [{
        id_str: 'm1', type: 'video', media_url_https: 'https://img.example/poster.jpg', url: 'https://t.co/media',
        video_info: { variants: [
          { content_type: 'video/mp4', bitrate: 256000, url: 'https://video.example/low.mp4' },
          { content_type: 'video/mp4', bitrate: 832000, url: 'https://video.example/high.mp4' },
          { content_type: 'application/x-mpegURL', url: 'https://video.example/stream.m3u8' }
        ] }
      }] }
    } as typeof original.legacy
    Object.assign(original, { quoted_status_result: { result: tweet('11', 'quoted') } })
    const wrapper = tweet('99', 'RT')
    Object.assign(wrapper.legacy, { retweeted_status_result: { result: original } })
    const page = parseTimeline({ entries: [{ entryId: 'tweet-99', content: { result: wrapper } }] })
    expect(page.tweets[0]).toMatchObject({
      id: '10',
      repostedBy: 'User 99',
      media: [{ playbackUrl: 'https://video.example/high.mp4' }],
      quotedTweet: { id: '11' }
    })
    expect(page.tweets[0]?.text).toBe('video')
  })
})

describe('parseViewer', () => {
  it('normalizes the signed-in viewer', () => {
    const result = user('viewer', 'me', 'My Name')
    result.legacy = { description: 'bio', followers_count: 12, friends_count: 3, statuses_count: 99 }
    const profile = parseViewer({ data: { viewer: { user_results: { result } } } })
    expect(profile).toMatchObject({ id: 'viewer', handle: 'me', followers: 12, following: 3, posts: 99 })
  })
})
