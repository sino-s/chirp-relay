import type { ConversationPage, NotificationPage, RelaySettings, SearchPage, SearchProduct, TimelineKind, TimelinePage, ViewerProfile } from '../types'
import { OPERATIONS } from './operations'
import { parseConversation, parseNotifications, parseSearch, parseTimeline, parseUserProfile, parseViewer } from './parser'

interface GraphqlError {
  message?: string
  code?: number
}

function baseHeaders(settings: RelaySettings): HeadersInit {
  return {
    'content-type': 'application/json',
    'X-Profile-Name': settings.profileName
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) throw new Error(`relay が HTTP ${response.status} を返しました。`)
  const body = await response.json() as { errors?: GraphqlError[] }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new Error(body.errors[0]?.message ?? 'Twitter API からエラーが返されました。')
  }
  return body
}

async function graphqlGet(
  settings: RelaySettings,
  operation: { path: string; features: object; fieldToggles?: object },
  variables: object,
  signal?: AbortSignal
): Promise<unknown> {
  const url = new URL(`${settings.baseUrl}/i/api${operation.path}`)
  url.searchParams.set('variables', JSON.stringify(variables))
  url.searchParams.set('features', JSON.stringify(operation.features))
  if (operation.fieldToggles) url.searchParams.set('fieldToggles', JSON.stringify(operation.fieldToggles))
  return readJson(await fetch(url, { headers: baseHeaders(settings), signal }))
}

async function graphqlPost(
  settings: RelaySettings,
  operation: { path: string; queryId: string; features: object },
  variables: object,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetch(`${settings.baseUrl}/i/api${operation.path}`, {
    method: 'POST',
    headers: baseHeaders(settings),
    body: JSON.stringify({ variables, features: operation.features, queryId: operation.queryId }),
    signal
  })
  return readJson(response)
}

export async function probeRelay(baseUrl: string, signal?: AbortSignal): Promise<string[]> {
  const [health, profiles] = await Promise.all([
    fetch(`${baseUrl}/health`, { signal }),
    fetch(`${baseUrl}/profiles`, { signal })
  ])
  if (!health.ok || !profiles.ok) throw new Error('relay に接続できませんでした。')
  const healthBody = await health.json() as { status?: string }
  const profilesBody = await profiles.json() as { profiles?: unknown }
  if (healthBody.status !== 'ok' || !Array.isArray(profilesBody.profiles)) {
    throw new Error('relay の応答形式を確認できませんでした。')
  }
  return profilesBody.profiles.filter((item): item is string => typeof item === 'string')
}

export async function fetchViewer(settings: RelaySettings, signal?: AbortSignal): Promise<ViewerProfile> {
  const value = await graphqlGet(
    settings,
    OPERATIONS.viewer,
    { withCommunitiesMemberships: true },
    signal
  )
  return parseViewer(value)
}

export async function fetchTimeline(
  settings: RelaySettings,
  kind: TimelineKind,
  cursor?: string,
  signal?: AbortSignal
): Promise<TimelinePage> {
  const operation = kind === 'for-you' ? OPERATIONS.home : OPERATIONS.latest
  const variables: Record<string, unknown> = {
    count: 20,
    includePromotedContent: false
  }
  if (kind === 'for-you') variables.withCommunity = true
  else variables.enableRanking = false
  if (cursor) variables.cursor = cursor
  const value = await graphqlPost(settings, operation, variables, signal)
  return parseTimeline(value)
}

export async function fetchUserTweets(
  settings: RelaySettings,
  userId: string,
  cursor?: string,
  signal?: AbortSignal
): Promise<TimelinePage> {
  const variables: Record<string, unknown> = {
    userId,
    count: 20,
    includePromotedContent: false,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true
  }
  if (cursor) variables.cursor = cursor
  const value = await graphqlGet(settings, OPERATIONS.userTweets, variables, signal)
  return parseTimeline(value)
}

export async function fetchUserProfile(settings: RelaySettings, handle: string, signal?: AbortSignal): Promise<ViewerProfile> {
  const value = await graphqlGet(
    settings,
    OPERATIONS.userByScreenName,
    { screen_name: handle, withGrokTranslatedBio: true },
    signal
  )
  return parseUserProfile(value)
}

export async function fetchConversation(
  settings: RelaySettings,
  tweetId: string,
  cursor?: string,
  signal?: AbortSignal
): Promise<ConversationPage> {
  const variables: Record<string, unknown> = {
    focalTweetId: tweetId,
    referrer: 'tweet',
    with_rux_injections: false,
    rankingMode: 'Relevance',
    includePromotedContent: false,
    withCommunity: true,
    withQuickPromoteEligibilityTweetFields: true,
    withBirdwatchNotes: true,
    withVoice: true
  }
  if (cursor) variables.cursor = cursor
  const value = await graphqlGet(settings, OPERATIONS.tweetDetail, variables, signal)
  return parseConversation(value, tweetId)
}

export async function fetchNotifications(
  settings: RelaySettings,
  tab: 'all' | 'mentions',
  cursor?: string,
  signal?: AbortSignal
): Promise<NotificationPage> {
  const variables: Record<string, unknown> = {
    timeline_type: tab === 'mentions' ? 'Mentions' : 'All',
    count: 20
  }
  if (cursor) variables.cursor = cursor
  const value = await graphqlGet(settings, OPERATIONS.notifications, variables, signal)
  return parseNotifications(value)
}

const SEARCH_PRODUCTS: Record<SearchProduct, string> = {
  top: 'Top',
  latest: 'Latest',
  people: 'People',
  media: 'Media'
}

export async function searchTwitter(
  settings: RelaySettings,
  query: string,
  product: SearchProduct,
  cursor?: string,
  signal?: AbortSignal
): Promise<SearchPage> {
  const variables: Record<string, unknown> = {
    rawQuery: query,
    count: 20,
    querySource: 'typed_query',
    product: SEARCH_PRODUCTS[product],
    withGrokTranslatedBio: false,
    withQuickPromoteEligibilityTweetFields: false
  }
  if (cursor) variables.cursor = cursor
  const value = await graphqlGet(settings, OPERATIONS.search, variables, signal)
  return parseSearch(value, product === 'people')
}
