import type { RelaySettings, TwitterList } from './types'

const STORAGE_KEY = 'chirp-relay:selected-lists:v1'

function accountKey(settings: RelaySettings): string {
  return `${settings.baseUrl}\n${settings.profileName}`
}

function validList(value: unknown): value is TwitterList {
  if (typeof value !== 'object' || value === null) return false
  const list = value as Partial<TwitterList>
  return typeof list.id === 'string' && typeof list.name === 'string' && typeof list.description === 'string' && typeof list.memberCount === 'number' && typeof list.subscriberCount === 'number' && typeof list.private === 'boolean' && typeof list.pinned === 'boolean'
}

export function loadSelectedLists(settings: RelaySettings): TwitterList[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const lists = stored[accountKey(settings)]
    return Array.isArray(lists) ? lists.filter(validList) : []
  } catch {
    return []
  }
}

export function saveSelectedLists(settings: RelaySettings, lists: TwitterList[]): void {
  let stored: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) stored = parsed as Record<string, unknown>
  } catch {
    // Replace malformed preferences with a valid object.
  }
  stored[accountKey(settings)] = lists
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}
