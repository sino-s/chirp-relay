import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTweet, setTweetLiked, setTweetRetweeted } from './client'

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
})
