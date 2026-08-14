import { describe, expect, it } from 'vitest'
import { parseHash, routeHref, routeScrollKey } from './router'

describe('router', () => {
  it('round-trips detail and media routes', () => {
    const href = routeHref({ name: 'tweet', tweetId: '123', media: 2 })
    expect(href).toBe('#/tweet/123?media=2')
    expect(parseHash(href)).toEqual({ name: 'tweet', tweetId: '123', media: 2 })
  })

  it('does not treat a missing or invalid media parameter as the first image', () => {
    expect(parseHash('#/tweet/123')).toEqual({ name: 'tweet', tweetId: '123', media: undefined })
    expect(parseHash('#/tweet/123?media=')).toEqual({ name: 'tweet', tweetId: '123', media: undefined })
    expect(parseHash('#/tweet/123?media=nope')).toEqual({ name: 'tweet', tweetId: '123', media: undefined })
    expect(parseHash('#/tweet/123?media=-1')).toEqual({ name: 'tweet', tweetId: '123', media: undefined })
    expect(parseHash('#/tweet/123?media=0')).toEqual({ name: 'tweet', tweetId: '123', media: 0 })
  })

  it('preserves search query and product', () => {
    const href = routeHref({ name: 'search', query: '猫 動画', product: 'media' })
    expect(parseHash(href)).toEqual({ name: 'search', query: '猫 動画', product: 'media' })
  })

  it('uses the public handle for profile routes', () => {
    const href = routeHref({ name: 'user', handle: 'example' })
    expect(parseHash(href)).toEqual({ name: 'user', handle: 'example' })
  })

  it('shares scroll position between a post and its media viewer', () => {
    expect(routeScrollKey({ name: 'tweet', tweetId: '123' })).toBe('tweet:123')
    expect(routeScrollKey({ name: 'tweet', tweetId: '123', media: 2 })).toBe('tweet:123')
    expect(routeScrollKey({ name: 'home' })).toBe('home')
  })

  it('falls back invalid routes and tabs safely', () => {
    expect(parseHash('#/unknown')).toEqual({ name: 'home' })
    expect(parseHash('#/notifications?tab=invalid')).toEqual({ name: 'notifications', tab: 'all' })
    expect(parseHash('#/search?tab=invalid')).toEqual({ name: 'search', query: '', product: 'top' })
  })
})
