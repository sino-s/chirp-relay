import { describe, expect, it } from 'vitest'
import { nextReplyCursor } from './TweetScreen'

describe('nextReplyCursor', () => {
  it('continues when a page adds replies and returns a new cursor', () => {
    expect(nextReplyCursor('current', 'next', 2, new Set(['current']))).toBe('next')
  })

  it.each([
    ['no fresh replies', 'next', 0, new Set(['current'])],
    ['no next cursor', undefined, 2, new Set(['current'])],
    ['same cursor', 'current', 2, new Set(['current'])],
    ['previously requested cursor', 'older', 2, new Set(['current', 'older'])]
  ])('stops for %s', (_label, responseCursor, freshReplyCount, requested) => {
    expect(nextReplyCursor('current', responseCursor, freshReplyCount, requested)).toBeUndefined()
  })
})
