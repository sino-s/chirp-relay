import { useCallback } from 'preact/hooks'
import { fetchBookmarks } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { TimelineFeed } from '../components/TimelineFeed'
import type { RelaySettings } from '../types'

export function BookmarksScreen({ settings, refreshToken = 0 }: { settings: RelaySettings; refreshToken?: number }) {
  const loadBookmarks = useCallback((cursor?: string, signal?: AbortSignal) => fetchBookmarks(settings, cursor, signal), [settings])

  return (
    <section>
      <AppHeader title="ブックマーク" />
      <TimelineFeed loadPage={loadBookmarks} refreshToken={refreshToken} emptyMessage="ブックマークした投稿はありません。" />
    </section>
  )
}
