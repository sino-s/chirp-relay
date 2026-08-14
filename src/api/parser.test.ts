import { describe, expect, it } from 'vitest'
import { parseConversation, parseNotifications, parseSearch, parseTimeline, parseViewer } from './parser'

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

describe('parseConversation', () => {
  it('separates ancestors, the focal post and replies', () => {
    const parent = tweet('1', 'parent')
    const focal = tweet('2', 'focal')
    const reply = tweet('3', 'reply')
    Object.assign(focal.legacy, { in_reply_to_status_id_str: '1' })
    Object.assign(reply.legacy, { in_reply_to_status_id_str: '2' })
    const value = { entries: [
      { entryId: 'tweet-1', content: { tweet_results: { result: parent } } },
      { entryId: 'tweet-2', content: { tweet_results: { result: focal } } },
      { entryId: 'conversationthread-3', content: { tweet_results: { result: reply } } },
      { entryId: 'cursor-bottom', content: { value: 'more-replies', cursorType: 'Bottom' } }
    ] }

    expect(parseConversation(value, '2')).toMatchObject({
      focalTweet: { id: '2' },
      ancestors: [{ id: '1' }],
      replies: [{ id: '3' }],
      nextCursor: 'more-replies'
    })
  })
})

describe('parseNotifications', () => {
  it('connects actors and the target post to a notification', () => {
    const value = { entries: [{
      entryId: 'notification-n1',
      content: {
        itemContent: {
          id: 'n1',
          notification_icon: { id: 'heart' },
          rich_message: { text: 'いいねされました' },
          timestamp_ms: '123'
        },
        notificationDetails: {
          from_users: [{ user_results: { result: user('u1', 'alice', 'Alice') } }],
          target_objects: [{ tweet_results: { result: tweet('10', 'target') } }]
        }
      }
    }, { entryId: 'cursor-bottom', content: { value: 'next', cursorType: 'Bottom' } }] }

    const page = parseNotifications(value)
    expect(page.notifications[0]).toMatchObject({
      id: 'n1',
      kind: 'heart',
      timestamp: 123,
      actors: [{ handle: 'alice' }],
      targetTweet: { id: '10' }
    })
    expect(page.nextCursor).toBe('next')
  })
})

describe('parseSearch', () => {
  it('reads people results', () => {
    const page = parseSearch({ entries: [{ entryId: 'user-u1', content: { user_results: { result: user('u1', 'alice', 'Alice') } } }] }, true)
    expect(page.users).toMatchObject([{ id: 'u1', handle: 'alice' }])
    expect(page.tweets).toEqual([])
  })

  it('finds posts nested inside media grid modules', () => {
    const page = parseSearch({ entries: [{
      entryId: 'search-grid-1',
      content: { items: [{ item: { tweet_results: { result: tweet('20', 'media result') } } }] }
    }] }, false)
    expect(page.tweets).toMatchObject([{ id: '20', text: 'media result' }])
  })
})
