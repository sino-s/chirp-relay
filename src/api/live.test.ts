import { describe, expect, it } from 'vitest'
import { fetchTimeline, fetchUserTweets, fetchViewer, probeRelay } from './client'

const runLive = import.meta.env.VITE_RELAY_INTEGRATION === '1'
const baseUrl = import.meta.env.VITE_RELAY_BASE_URL ?? 'http://localhost:4545'

describe.runIf(runLive)('live relay integration', () => {
  it('reads viewer, both home timelines and viewer posts', async () => {
    const profiles = await probeRelay(baseUrl)
    expect(profiles.length).toBeGreaterThan(0)
    const settings = { baseUrl, profileName: profiles[0]! }

    const viewer = await fetchViewer(settings)
    expect(viewer.id).not.toBe('')
    expect(viewer.handle).not.toBe('')

    const [forYou, following, ownPosts] = await Promise.all([
      fetchTimeline(settings, 'for-you'),
      fetchTimeline(settings, 'following'),
      fetchUserTweets(settings, viewer.id)
    ])
    expect(forYou.tweets.length).toBeGreaterThan(0)
    expect(following.tweets.length).toBeGreaterThan(0)
    expect(ownPosts.tweets.length).toBeGreaterThan(0)
    expect(forYou.nextCursor).toBeTruthy()
    expect(following.nextCursor).toBeTruthy()
    expect(ownPosts.nextCursor).toBeTruthy()
  }, 30_000)
})
