import { describe, expect, it } from 'vitest'
import { normalizeRelayUrl } from './settings'

describe('normalizeRelayUrl', () => {
  it('allows local HTTP and removes trailing slashes', () => {
    expect(normalizeRelayUrl(' http://localhost:4545/// ')).toBe('http://localhost:4545')
    expect(normalizeRelayUrl('http://127.0.0.1:4545')).toBe('http://127.0.0.1:4545')
  })

  it('requires HTTPS for remote hosts', () => {
    expect(() => normalizeRelayUrl('http://machine.tailnet.ts.net')).toThrow('HTTPS')
    expect(normalizeRelayUrl('https://machine.tailnet.ts.net/')).toBe('https://machine.tailnet.ts.net')
  })

  it('rejects URL credentials and query strings', () => {
    expect(() => normalizeRelayUrl('https://user:pass@example.com')).toThrow('認証情報')
    expect(() => normalizeRelayUrl('https://example.com?token=secret')).toThrow('認証情報')
  })
})
