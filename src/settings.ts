import type { RelaySettings } from './types'

const STORAGE_KEY = 'chirp-relay:settings:v1'

export function normalizeRelayUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error('正しい relay URL を入力してください。')
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error('localhost 以外の relay には HTTPS URL を指定してください。')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('認証情報、クエリ、ハッシュを含まない URL を指定してください。')
  }
  return url.toString().replace(/\/$/, '')
}

export function loadSettings(): RelaySettings | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<RelaySettings>
    if (typeof parsed.baseUrl !== 'string' || typeof parsed.profileName !== 'string') return undefined
    return { baseUrl: normalizeRelayUrl(parsed.baseUrl), profileName: parsed.profileName }
  } catch {
    return undefined
  }
}

export function saveSettings(settings: RelaySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
