import { describe, expect, it } from 'vitest'
import { parseConversation, parseNotifications, parseSearch, parseTimeline, parseTwitterLists, parseViewer } from './parser'

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
      media: [{
        playbackUrl: 'https://video.example/high.mp4',
        playbackUrls: ['https://video.example/high.mp4', 'https://video.example/low.mp4']
      }],
      quotedTweet: { id: '11' }
    })
    expect(page.tweets[0]?.text).toBe('video')
  })

  it('reads URL entities from long-form posts', () => {
    const result = tweet('12', 'legacy fallback')
    Object.assign(result, {
      note_tweet: { note_tweet_results: { result: {
        text: 'long post https://t.co/note',
        entity_set: { urls: [{
          url: 'https://t.co/note',
          expanded_url: 'https://example.com/long-post',
          display_url: 'example.com/long-post'
        }] }
      } } }
    })
    const page = parseTimeline({ entries: [{ entryId: 'tweet-12', content: { tweet_results: { result } } }] })
    expect(page.tweets[0]).toMatchObject({
      text: 'long post https://t.co/note',
      links: [{ expandedUrl: 'https://example.com/long-post', displayUrl: 'example.com/long-post' }]
    })
  })

  it('reads protected authors and standard URL cards', () => {
    const result = tweet('13', 'watch https://t.co/video')
    Object.assign(result.core.user_results.result, { privacy: { protected: true } })
    Object.assign(result.legacy, { entities: { urls: [{
      url: 'https://t.co/video',
      expanded_url: 'https://example.com/watch',
      display_url: 'example.com/watch'
    }] } })
    Object.assign(result, { card: { legacy: {
      binding_values: [
        { key: 'title', value: { string_value: 'Video title' } },
        { key: 'description', value: { string_value: 'Video description' } },
        { key: 'vanity_url', value: { string_value: 'example.com' } },
        { key: 'card_url', value: { string_value: 'https://t.co/video' } },
        { key: 'player_image_large', value: { image_value: { url: 'https://pbs.twimg.com/card.jpg', width: 640, height: 360 } } }
      ]
    } } })

    const page = parseTimeline({ entries: [{ entryId: 'tweet-13', content: { tweet_results: { result } } }] })

    expect(page.tweets[0]).toMatchObject({
      author: { protected: true },
      linkPreview: {
        url: 'https://example.com/watch',
        title: 'Video title',
        description: 'Video description',
        domain: 'example.com',
        imageUrl: 'https://pbs.twimg.com/card.jpg'
      }
    })
  })

  it('reads URL previews from unified cards', () => {
    const result = tweet('14', 'article')
    const unified = {
      component_objects: {
        details: { type: 'details', data: { title: { content: 'Article title' }, subtitle: { content: 'example.org' }, destination: 'browser' } },
        media: { type: 'media', data: { id: 'image' } }
      },
      destination_objects: { browser: { data: { url_data: { url: 'https://example.org/article' } } } },
      media_entities: { image: { media_url_https: 'https://pbs.twimg.com/article.jpg', original_info: { width: 1200, height: 630 } } }
    }
    Object.assign(result, { card: { legacy: { binding_values: [{ key: 'unified_card', value: { string_value: JSON.stringify(unified) } }] } } })

    const page = parseTimeline({ entries: [{ entryId: 'tweet-14', content: { tweet_results: { result } } }] })

    expect(page.tweets[0]?.linkPreview).toEqual({
      url: 'https://example.org/article',
      title: 'Article title',
      domain: 'example.org',
      imageUrl: 'https://pbs.twimg.com/article.jpg',
      imageWidth: 1200,
      imageHeight: 630
    })
  })

  it('extracts posts nested in a profile media grid', () => {
    const page = parseTimeline({ entries: [{
      entryId: 'profile-grid-0',
      content: { items: [
        { entryId: 'profile-grid-0-tweet-21', item: { tweet_results: { result: tweet('21', 'first photo') } } },
        { entryId: 'profile-grid-0-tweet-22', item: { tweet_results: { result: tweet('22', 'second photo') } } }
      ] }
    }] })

    expect(page.tweets).toMatchObject([{ id: '21' }, { id: '22' }])
  })
})

describe('parseViewer', () => {
  it('normalizes the signed-in viewer', () => {
    const result = user('viewer', 'me', 'My Name')
    result.legacy = {
      description: 'bio',
      followers_count: 12,
      friends_count: 3,
      statuses_count: 99,
      url: 'https://t.co/profile',
      entities: { url: { urls: [{ url: 'https://t.co/profile', expanded_url: 'https://example.com/about', display_url: 'example.com/about' }] } }
    }
    Object.assign(result, { privacy: { protected: true } })
    const profile = parseViewer({ data: { viewer: { user_results: { result } } } })
    expect(profile).toMatchObject({
      id: 'viewer',
      handle: 'me',
      followers: 12,
      following: 3,
      posts: 99,
      protected: true,
      website: { url: 'https://example.com/about', displayUrl: 'example.com/about' }
    })
  })
})

describe('parseTwitterLists', () => {
  it('normalizes list metadata, ownership and pagination', () => {
    const value = { entries: [
      { entryId: 'list-1', content: { itemContent: { list: {
        id_str: 'list-1',
        name: 'Friends',
        description: 'People I know',
        member_count: 12,
        subscriber_count: 3,
        mode: 'Private',
        pinning: true,
        default_banner_media: { media_info: { original_img_url: 'https://img.example/list.jpg' } },
        user_results: { result: user('owner', 'me', 'My Name') }
      } } } },
      { entryId: 'cursor-bottom', content: { value: 'next-lists', cursorType: 'Bottom' } }
    ] }

    expect(parseTwitterLists(value)).toEqual({
      lists: [{
        id: 'list-1',
        name: 'Friends',
        description: 'People I know',
        memberCount: 12,
        subscriberCount: 3,
        private: true,
        pinned: true,
        bannerUrl: 'https://img.example/list.jpg',
        owner: { name: 'My Name', handle: 'me', avatarUrl: 'https://img.example/me.jpg' }
      }],
      nextCursor: 'next-lists'
    })
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
