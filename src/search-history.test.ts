import { beforeEach, describe, expect, it } from 'vitest'
import { addSearchHistory, clearSearchHistory, loadSearchHistory } from './search-history'

const first = { baseUrl: 'http://relay.example', profileName: 'first' }
const second = { baseUrl: 'http://relay.example', profileName: 'second' }

describe('search history', () => {
  beforeEach(() => localStorage.clear())

  it('keeps the ten most recent unique searches per relay profile', () => {
    for (let index = 1; index <= 11; index += 1) addSearchHistory(first, `query ${index}`)
    addSearchHistory(first, ' QUERY 5 ')
    addSearchHistory(second, 'other account')

    expect(loadSearchHistory(first)).toEqual(['QUERY 5', 'query 11', 'query 10', 'query 9', 'query 8', 'query 7', 'query 6', 'query 4', 'query 3', 'query 2'])
    expect(loadSearchHistory(second)).toEqual(['other account'])
  })

  it('clears only the current relay profile history', () => {
    addSearchHistory(first, 'first query')
    addSearchHistory(second, 'second query')
    clearSearchHistory(first)

    expect(loadSearchHistory(first)).toEqual([])
    expect(loadSearchHistory(second)).toEqual(['second query'])
  })
})
