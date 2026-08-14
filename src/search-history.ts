import type { RelaySettings } from './types'

const STORAGE_KEY = 'chirp-relay:search-history:v1'
const HISTORY_LIMIT = 10

function accountKey(settings: RelaySettings): string {
  return `${settings.baseUrl}\n${settings.profileName}`
}

function readStored(): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export function loadSearchHistory(settings: RelaySettings): string[] {
  const value = readStored()[accountKey(settings)]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, HISTORY_LIMIT)
}

export function addSearchHistory(settings: RelaySettings, query: string): string[] {
  const normalized = query.trim()
  if (!normalized) return loadSearchHistory(settings)
  const history = loadSearchHistory(settings)
  const next = [normalized, ...history.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, HISTORY_LIMIT)
  const stored = readStored()
  stored[accountKey(settings)] = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  return next
}

export function clearSearchHistory(settings: RelaySettings): void {
  const stored = readStored()
  stored[accountKey(settings)] = []
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}
