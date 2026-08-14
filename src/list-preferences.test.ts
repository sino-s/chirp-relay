import { beforeEach, describe, expect, it } from 'vitest'
import { loadSelectedLists, saveSelectedLists } from './list-preferences'
import type { TwitterList } from './types'

const first = { baseUrl: 'http://relay.example', profileName: 'first' }
const second = { baseUrl: 'http://relay.example', profileName: 'second' }
const list: TwitterList = { id: '1', name: 'Friends', description: '', memberCount: 2, subscriberCount: 0, private: true, pinned: false }

describe('list preferences', () => {
  beforeEach(() => localStorage.clear())

  it('keeps selected lists separate for each relay profile', () => {
    saveSelectedLists(first, [list])
    saveSelectedLists(second, [{ ...list, id: '2', name: 'Work' }])

    expect(loadSelectedLists(first).map((item) => item.id)).toEqual(['1'])
    expect(loadSelectedLists(second).map((item) => item.id)).toEqual(['2'])
  })

  it('recovers from malformed stored preferences', () => {
    localStorage.setItem('chirp-relay:selected-lists:v1', '{broken')
    expect(loadSelectedLists(first)).toEqual([])
    expect(() => saveSelectedLists(first, [list])).not.toThrow()
    expect(loadSelectedLists(first)).toEqual([list])
  })
})
