import { describe, expect, it } from 'vitest'
import { fetchConversation, fetchListTimeline, fetchNotifications, fetchTimeline, fetchTwitterLists, fetchUserLikes, fetchUserMedia, fetchUserProfile, fetchUserTweets, fetchViewer, probeRelay, searchTwitter } from './client'

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

    const [forYou, following, ownPosts, ownMedia, ownLikes] = await Promise.all([
      fetchTimeline(settings, 'for-you'),
      fetchTimeline(settings, 'following'),
      fetchUserTweets(settings, viewer.id),
      fetchUserMedia(settings, viewer.id),
      fetchUserLikes(settings, viewer.id)
    ])
    expect(forYou.tweets.length).toBeGreaterThan(0)
    expect(following.tweets.length).toBeGreaterThan(0)
    expect(ownPosts.tweets.length).toBeGreaterThan(0)
    expect(ownMedia.tweets.length).toBeGreaterThan(0)
    expect(ownLikes.tweets).toEqual(expect.any(Array))
    expect(forYou.nextCursor).toBeTruthy()
    expect(following.nextCursor).toBeTruthy()
    expect(ownPosts.nextCursor).toBeTruthy()

    const lists = await fetchTwitterLists(settings, viewer.id)
    expect(lists.lists.length).toBeGreaterThan(0)
    const listTimeline = await fetchListTimeline(settings, lists.lists[0]!.id)
    expect(listTimeline.tweets).toEqual(expect.any(Array))

    const sampleTweet = forYou.tweets[0]!
    const [conversation, authorProfile, allNotifications, mentions, top, latest, people, media] = await Promise.all([
      fetchConversation(settings, sampleTweet.id),
      fetchUserProfile(settings, sampleTweet.author.handle),
      fetchNotifications(settings, 'all'),
      fetchNotifications(settings, 'mentions'),
      searchTwitter(settings, 'openai', 'top'),
      searchTwitter(settings, 'openai', 'latest'),
      searchTwitter(settings, 'openai', 'people'),
      searchTwitter(settings, 'openai', 'media')
    ])
    expect(conversation.focalTweet?.id).toBe(sampleTweet.id)
    expect(authorProfile.id).toBe(sampleTweet.author.id)
    expect(allNotifications.nextCursor).toBeTruthy()
    expect(mentions.nextCursor).toBeTruthy()
    expect(top.tweets.length).toBeGreaterThan(0)
    expect(latest.tweets.length).toBeGreaterThan(0)
    expect(people.users.length).toBeGreaterThan(0)
    expect(media.tweets.length).toBeGreaterThan(0)
  }, 30_000)
})
