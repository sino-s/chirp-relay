import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTweet, fetchListTimeline, fetchTwitterLists, fetchUserLikes, fetchUserMedia, setTweetLiked, setTweetRetweeted } from './client'

const settings = { baseUrl: 'http://relay.example', profileName: 'account-one' }

function response(body: object): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
}

describe('relay write operations', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a text-only tweet with the catalog operation shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: { create_tweet: { tweet_results: { result: { rest_id: 'new-id' } } } } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createTweet(settings, 'hello')).resolves.toBe('new-id')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://relay.example/i/api/graphql/H-t2v_HvFR07ZBP9aOeKoA/CreateTweet')
    expect(init.headers).toMatchObject({ 'X-Profile-Name': 'account-one' })
    expect(JSON.parse(String(init.body))).toMatchObject({
      queryId: 'H-t2v_HvFR07ZBP9aOeKoA',
      variables: {
        tweet_text: 'hello',
        media: { media_entities: [], possibly_sensitive: false }
      }
    })
  })

  it('uses the distinct create and delete operations for likes and retweets', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ data: {} })))
    vi.stubGlobal('fetch', fetchMock)

    await setTweetLiked(settings, 'tweet-1', true)
    await setTweetLiked(settings, 'tweet-1', false)
    await setTweetRetweeted(settings, 'tweet-1', true)
    await setTweetRetweeted(settings, 'tweet-1', false)

    expect(fetchMock.mock.calls.map(([url]) => String(url).split('/').at(-1))).toEqual([
      'FavoriteTweet',
      'UnfavoriteTweet',
      'CreateRetweet',
      'DeleteRetweet'
    ])
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)).variables)).toEqual([
      { tweet_id: 'tweet-1' },
      { tweet_id: 'tweet-1' },
      { tweet_id: 'tweet-1' },
      { source_tweet_id: 'tweet-1' }
    ])
  })

  it('uses separate profile collections for media and likes', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ entries: [] })))
    vi.stubGlobal('fetch', fetchMock)

    await fetchUserMedia(settings, 'user-1')
    await fetchUserLikes(settings, 'user-1', 'next')

    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)))
    expect(urls.map((url) => url.pathname.split('/').at(-1))).toEqual(['UserMedia', 'Likes'])
    expect(urls.map((url) => JSON.parse(String(url.searchParams.get('variables'))))).toEqual([
      { userId: 'user-1', count: 20, includePromotedContent: false, withClientEventToken: false, withBirdwatchNotes: false, withVoice: true },
      { userId: 'user-1', count: 20, includePromotedContent: false, withClientEventToken: false, withBirdwatchNotes: false, withVoice: true, cursor: 'next' }
    ])
  })
})

describe('list operations', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('accepts usable list data when optional banner fields return GraphQL errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      data: { entries: [{ entryId: 'list-1', content: { itemContent: { list: { id_str: '1', name: 'One', description: '', member_count: 1, subscriber_count: 0, mode: 'Public', pinning: false } } } }] },
      errors: [{ message: 'default banner is unavailable' }]
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTwitterLists(settings, 'user-1', 'next')).resolves.toMatchObject({ lists: [{ id: '1', name: 'One' }] })
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.pathname.split('/').at(-1)).toBe('CombinedLists')
    expect(JSON.parse(String(url.searchParams.get('variables')))).toEqual({ userId: 'user-1', count: 100, cursor: 'next' })
  })

  it('requests a list timeline with its list id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ entries: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchListTimeline(settings, 'list-1')
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.pathname.split('/').at(-1)).toBe('ListLatestTweetsTimeline')
    expect(JSON.parse(String(url.searchParams.get('variables')))).toEqual({ listId: 'list-1', count: 40 })
  })
})
