import type { ConversationPage, NotificationItem, NotificationPage, SearchPage, TimelinePage, Tweet, TweetAuthor, TweetLink, TweetLinkPreview, TweetMedia, TwitterList, TwitterListPage, ViewerProfile } from '../types'

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function objectAt(value: unknown, ...keys: string[]): JsonObject | undefined {
  let current: unknown = value
  for (const key of keys) {
    if (!isObject(current)) return undefined
    current = current[key]
  }
  return isObject(current) ? current : undefined
}

function stringAt(value: unknown, ...keys: string[]): string | undefined {
  let current: unknown = value
  for (const key of keys) {
    if (!isObject(current)) return undefined
    current = current[key]
  }
  return typeof current === 'string' ? current : undefined
}

function numberAt(value: unknown, ...keys: string[]): number {
  let current: unknown = value
  for (const key of keys) {
    if (!isObject(current)) return 0
    current = current[key]
  }
  if (typeof current === 'number') return current
  if (typeof current === 'string') return Number(current) || 0
  return 0
}

function booleanAt(value: unknown, ...keys: string[]): boolean {
  let current: unknown = value
  for (const key of keys) {
    if (!isObject(current)) return false
    current = current[key]
  }
  return current === true
}

function visit(value: unknown, callback: (object: JsonObject) => boolean | void): boolean {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (visit(item, callback)) return true
    }
    return false
  }
  if (!isObject(value)) return false
  if (callback(value)) return true
  for (const child of Object.values(value)) {
    if (visit(child, callback)) return true
  }
  return false
}

function findTweetResult(value: unknown): JsonObject | undefined {
  let found: JsonObject | undefined
  visit(value, (object) => {
    if (typeof object.rest_id === 'string' && isObject(object.legacy) && typeof object.legacy.full_text === 'string') {
      found = object
      return true
    }
  })
  return found
}

function collectTweetResults(value: unknown): JsonObject[] {
  const results: JsonObject[] = []
  function walk(current: unknown): void {
    if (Array.isArray(current)) {
      for (const item of current) walk(item)
      return
    }
    if (!isObject(current)) return
    const result = objectAt(current, 'tweet_results', 'result')
    const tweet = result ? findTweetResult(result) : undefined
    if (tweet) {
      results.push(tweet)
      return
    }
    for (const child of Object.values(current)) walk(child)
  }
  walk(value)
  if (results.length === 0) {
    const direct = findTweetResult(value)
    if (direct) results.push(direct)
  }
  return results
}

function parseUserAuthor(user: JsonObject): TweetAuthor | undefined {
  if (!user) return undefined
  const id = stringAt(user, 'rest_id')
  const handle = stringAt(user, 'core', 'screen_name') ?? stringAt(user, 'legacy', 'screen_name')
  if (!id || !handle) return undefined
  return {
    id,
    handle,
    name: stringAt(user, 'core', 'name') ?? stringAt(user, 'legacy', 'name') ?? handle,
    avatarUrl:
      stringAt(user, 'avatar', 'image_url') ??
      stringAt(user, 'legacy', 'profile_image_url_https') ??
      '',
    verified: booleanAt(user, 'is_blue_verified') || booleanAt(user, 'verification', 'verified'),
    protected: booleanAt(user, 'privacy', 'protected') || booleanAt(user, 'legacy', 'protected')
  }
}

function parseAuthor(result: JsonObject): TweetAuthor | undefined {
  const user = objectAt(result, 'core', 'user_results', 'result')
  return user ? parseUserAuthor(user) : undefined
}

function parseLinks(source: JsonObject): TweetLink[] {
  const raw = (objectAt(source, 'entity_set') ?? objectAt(source, 'entities'))?.urls
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!isObject(item) || typeof item.url !== 'string') return []
    return [{
      url: item.url,
      expandedUrl: typeof item.expanded_url === 'string' ? item.expanded_url : item.url,
      displayUrl: typeof item.display_url === 'string' ? item.display_url : item.url
    }]
  })
}

function parseMedia(legacy: JsonObject): TweetMedia[] {
  const raw = objectAt(legacy, 'extended_entities')?.media
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!isObject(item) || typeof item.id_str !== 'string' || typeof item.media_url_https !== 'string') return []
    const type = item.type
    if (type !== 'photo' && type !== 'video' && type !== 'animated_gif') return []
    const variants = objectAt(item, 'video_info')?.variants
    let playbackUrl: string | undefined
    let playbackUrls: string[] | undefined
    if (Array.isArray(variants)) {
      const mp4Variants = variants.flatMap((variant) => {
        if (!isObject(variant) || variant.content_type !== 'video/mp4' || typeof variant.url !== 'string') return []
        return [{ url: variant.url, bitrate: typeof variant.bitrate === 'number' ? variant.bitrate : 0 }]
      }).sort((left, right) => right.bitrate - left.bitrate)
      playbackUrls = [...new Set(mp4Variants.map((variant) => variant.url))]
      playbackUrl = playbackUrls[0]
    }
    return [{
      id: item.id_str,
      type,
      previewUrl: item.media_url_https,
      playbackUrl,
      playbackUrls,
      width: numberAt(item, 'original_info', 'width') || undefined,
      height: numberAt(item, 'original_info', 'height') || undefined,
      altText: typeof item.ext_alt_text === 'string' ? item.ext_alt_text : undefined
    }]
  })
}

function cardBindingValues(card: JsonObject): Map<string, JsonObject> {
  const values = card.binding_values
  const bindings = new Map<string, JsonObject>()
  if (!Array.isArray(values)) return bindings
  for (const binding of values) {
    if (!isObject(binding) || typeof binding.key !== 'string' || !isObject(binding.value)) continue
    bindings.set(binding.key, binding.value)
  }
  return bindings
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function parseUnifiedCard(value: string): TweetLinkPreview | undefined {
  let unified: JsonObject
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isObject(parsed)) return undefined
    unified = parsed
  } catch {
    return undefined
  }

  const components = objectAt(unified, 'component_objects')
  const destinations = objectAt(unified, 'destination_objects')
  if (!components || !destinations) return undefined
  const details = Object.values(components).find((item) => isObject(item) && item.type === 'details')
  if (!isObject(details)) return undefined
  const data = objectAt(details, 'data')
  const destinationName = stringAt(data, 'destination')
  const destination = destinationName ? destinations[destinationName] : undefined
  const url = stringAt(destination, 'data', 'url_data', 'url')
  const title = stringAt(data, 'title', 'content')
  if (!url || !title) return undefined

  const mediaComponent = Object.values(components).find((item) => isObject(item) && item.type === 'media')
  const mediaId = stringAt(mediaComponent, 'data', 'id')
  const media = mediaId ? objectAt(unified, 'media_entities', mediaId) : undefined
  return {
    url,
    title,
    domain: stringAt(data, 'subtitle', 'content') ?? stringAt(destination, 'data', 'url_data', 'vanity') ?? hostname(url),
    imageUrl: stringAt(media, 'media_url_https'),
    imageWidth: numberAt(media, 'original_info', 'width') || undefined,
    imageHeight: numberAt(media, 'original_info', 'height') || undefined
  }
}

function parseLinkPreview(result: JsonObject, links: TweetLink[]): TweetLinkPreview | undefined {
  const card = objectAt(result, 'card', 'legacy')
  if (!card) return undefined
  const bindings = cardBindingValues(card)
  const unifiedValue = stringAt(bindings.get('unified_card'), 'string_value')
  if (unifiedValue) return parseUnifiedCard(unifiedValue)

  const title = stringAt(bindings.get('title'), 'string_value')
  const cardUrl = stringAt(bindings.get('card_url'), 'string_value') ?? stringAt(card, 'url')
  if (!title || !cardUrl) return undefined
  const link = links.find((item) => item.url === cardUrl)
  const url = link?.expandedUrl ?? cardUrl
  const imageKeys = ['summary_photo_image_large', 'player_image_large', 'thumbnail_image_large', 'summary_photo_image', 'player_image', 'thumbnail_image']
  let image: JsonObject | undefined
  for (const key of imageKeys) {
    image = objectAt(bindings.get(key), 'image_value')
    if (image) break
  }
  return {
    url,
    title,
    domain: stringAt(bindings.get('vanity_url'), 'string_value') ?? stringAt(bindings.get('domain'), 'string_value') ?? hostname(url),
    description: stringAt(bindings.get('description'), 'string_value'),
    imageUrl: stringAt(image, 'url'),
    imageWidth: numberAt(image, 'width') || undefined,
    imageHeight: numberAt(image, 'height') || undefined
  }
}

function cleanText(text: string, media: TweetMedia[], links: TweetLink[], legacy: JsonObject): string {
  let cleaned = text
  const rawMedia = objectAt(legacy, 'extended_entities')?.media
  if (Array.isArray(rawMedia)) {
    for (const item of rawMedia) {
      if (isObject(item) && typeof item.url === 'string') cleaned = cleaned.replace(item.url, '')
    }
  }
  if (media.length > 0 && links.length > 0) {
    const quotedLink = links.at(-1)
    if (quotedLink?.expandedUrl.includes('/status/')) cleaned = cleaned.replace(quotedLink.url, '')
  }
  return cleaned.trim()
}

export function parseTweetResult(result: JsonObject, depth = 0): Tweet | undefined {
  if (depth > 1) return undefined
  const wrapperLegacy = objectAt(result, 'legacy')
  if (!wrapperLegacy) return undefined
  const retweeted = objectAt(wrapperLegacy, 'retweeted_status_result', 'result')
  const source = retweeted ? findTweetResult(retweeted) ?? result : result
  const legacy = objectAt(source, 'legacy')
  const author = parseAuthor(source)
  const id = stringAt(source, 'rest_id')
  if (!legacy || !author || !id) return undefined

  const media = parseMedia(legacy)
  const noteResult = objectAt(source, 'note_tweet', 'note_tweet_results', 'result')
  const noteText = stringAt(noteResult, 'text')
  const noteLinks = noteResult ? parseLinks(noteResult) : []
  const links = noteLinks.length > 0 ? noteLinks : parseLinks(legacy)
  const rawText = noteText ?? stringAt(legacy, 'full_text') ?? ''
  const quotedResult = objectAt(source, 'quoted_status_result', 'result')
  const quotedSource = quotedResult ? findTweetResult(quotedResult) : undefined
  const wrapperAuthor = retweeted ? parseAuthor(result) : undefined
  const views = numberAt(source, 'views', 'count')

  return {
    id,
    text: cleanText(rawText, media, links, legacy),
    author,
    createdAt: stringAt(legacy, 'created_at') ?? '',
    metrics: {
      replies: numberAt(legacy, 'reply_count'),
      reposts: numberAt(legacy, 'retweet_count'),
      likes: numberAt(legacy, 'favorite_count'),
      views: views || undefined
    },
    media,
    links,
    liked: booleanAt(legacy, 'favorited'),
    retweeted: booleanAt(legacy, 'retweeted'),
    linkPreview: parseLinkPreview(source, links),
    quotedTweet: quotedSource ? parseTweetResult(quotedSource, depth + 1) : undefined,
    repostedBy: wrapperAuthor?.name,
    inReplyToId: stringAt(legacy, 'in_reply_to_status_id_str'),
    url: `https://x.com/${author.handle}/status/${id}`
  }
}

function findEntries(value: unknown): JsonObject[] {
  const entries: JsonObject[] = []
  visit(value, (object) => {
    if (typeof object.entryId === 'string') entries.push(object)
  })
  return entries
}

function findBottomCursor(value: unknown): string | undefined {
  let cursor: string | undefined
  visit(value, (object) => {
    if (object.cursorType === 'Bottom' && typeof object.value === 'string') {
      cursor = object.value
      return true
    }
  })
  return cursor
}

export function parseTimeline(value: unknown): TimelinePage {
  const byId = new Map<string, Tweet>()
  for (const entry of findEntries(value)) {
    const entryId = String(entry.entryId)
    if (entryId.startsWith('promoted-') || (!entryId.startsWith('tweet-') && !entryId.startsWith('profile-grid-'))) continue
    for (const result of collectTweetResults(entry)) {
      const tweet = parseTweetResult(result)
      if (tweet && !byId.has(tweet.id)) byId.set(tweet.id, tweet)
    }
  }
  return { tweets: [...byId.values()], nextCursor: findBottomCursor(value) }
}

export function parseTwitterLists(value: unknown): TwitterListPage {
  const byId = new Map<string, TwitterList>()
  visit(value, (object) => {
    const list = object.list
    if (!isObject(list) || typeof list.id_str !== 'string' || typeof list.name !== 'string') return
    const ownerResult = objectAt(list, 'user_results', 'result')
    const ownerHandle = stringAt(ownerResult, 'core', 'screen_name')
    const ownerName = stringAt(ownerResult, 'core', 'name')
    byId.set(list.id_str, {
      id: list.id_str,
      name: list.name,
      description: typeof list.description === 'string' ? list.description : '',
      memberCount: numberAt(list, 'member_count'),
      subscriberCount: numberAt(list, 'subscriber_count'),
      private: list.mode === 'Private',
      pinned: list.pinning === true,
      bannerUrl: stringAt(list, 'default_banner_media', 'media_info', 'original_img_url'),
      owner: ownerHandle && ownerName ? {
        handle: ownerHandle,
        name: ownerName,
        avatarUrl: stringAt(ownerResult, 'avatar', 'image_url') ?? ''
      } : undefined
    })
  })
  return { lists: [...byId.values()], nextCursor: findBottomCursor(value) }
}

export function parseViewer(value: unknown): ViewerProfile {
  const result = objectAt(value, 'data', 'viewer', 'user_results', 'result')
  if (!result) throw new Error('プロフィール情報を読み取れませんでした。')
  return parseUserProfileResult(result)
}

function parseUserProfileResult(result: JsonObject): ViewerProfile {
  const id = stringAt(result, 'rest_id')
  const handle = stringAt(result, 'core', 'screen_name')
  if (!id || !handle) throw new Error('プロフィール情報が不完全です。')
  return {
    id,
    handle,
    name: stringAt(result, 'core', 'name') ?? handle,
    description: stringAt(result, 'legacy', 'description') ?? '',
    avatarUrl: stringAt(result, 'avatar', 'image_url') ?? stringAt(result, 'legacy', 'profile_image_url_https') ?? '',
    bannerUrl: stringAt(result, 'legacy', 'profile_banner_url'),
    followers: numberAt(result, 'legacy', 'followers_count'),
    following: numberAt(result, 'legacy', 'friends_count'),
    posts: numberAt(result, 'legacy', 'statuses_count'),
    joinedAt: stringAt(result, 'core', 'created_at'),
    protected: booleanAt(result, 'privacy', 'protected') || booleanAt(result, 'legacy', 'protected'),
    website: parseProfileWebsite(result)
  }
}

function parseProfileWebsite(result: JsonObject): ViewerProfile['website'] {
  const urls = objectAt(result, 'legacy', 'entities', 'url')?.urls
  const entity = Array.isArray(urls) ? urls.find(isObject) : undefined
  const fallbackUrl = stringAt(result, 'legacy', 'url')
  const url = entity && typeof entity.expanded_url === 'string' ? entity.expanded_url : fallbackUrl
  if (!url) return undefined
  try {
    const protocol = new URL(url).protocol
    if (protocol !== 'http:' && protocol !== 'https:') return undefined
  } catch {
    return undefined
  }
  return {
    url,
    displayUrl: entity && typeof entity.display_url === 'string' ? entity.display_url : url
  }
}

export function parseUserProfile(value: unknown): ViewerProfile {
  const result = objectAt(value, 'data', 'user', 'result')
  if (!result) throw new Error('ユーザー情報を読み取れませんでした。')
  return parseUserProfileResult(result)
}

export function parseConversation(value: unknown, focalTweetId: string): ConversationPage {
  const byId = new Map<string, Tweet>()
  for (const entry of findEntries(value)) {
    const entryId = String(entry.entryId)
    if (!entryId.startsWith('tweet-') && !entryId.startsWith('conversationthread-')) continue
    for (const result of collectTweetResults(entry)) {
      const tweet = parseTweetResult(result)
      if (tweet) byId.set(tweet.id, tweet)
    }
  }

  const focalTweet = byId.get(focalTweetId)
  const ancestorIds = new Set<string>()
  const ancestors: Tweet[] = []
  let parentId = focalTweet?.inReplyToId
  while (parentId && !ancestorIds.has(parentId)) {
    const parent = byId.get(parentId)
    if (!parent) break
    ancestorIds.add(parentId)
    ancestors.unshift(parent)
    parentId = parent.inReplyToId
  }
  const replies = [...byId.values()].filter((tweet) => tweet.id !== focalTweetId && !ancestorIds.has(tweet.id))
  return { focalTweet, ancestors, replies, nextCursor: findBottomCursor(value) }
}

function findNotificationObject(entry: JsonObject): JsonObject | undefined {
  let found: JsonObject | undefined
  visit(entry, (object) => {
    if (typeof object.id === 'string' && isObject(object.rich_message) && 'notification_icon' in object) {
      found = object
      return true
    }
  })
  return found
}

function parseNotificationEntry(entry: JsonObject): NotificationItem | undefined {
  const notification = findNotificationObject(entry)
  if (!notification) return undefined
  const id = stringAt(notification, 'id')
  if (!id) return undefined
  let details: JsonObject | undefined
  visit(entry, (object) => {
    if (Array.isArray(object.from_users) && Array.isArray(object.target_objects)) {
      details = object
      return true
    }
  })
  const fromUsers = details?.from_users
  const actors: TweetAuthor[] = []
  if (Array.isArray(fromUsers)) {
    for (const wrapper of fromUsers) {
      const user = objectAt(wrapper, 'user_results', 'result')
      const author = user ? parseUserAuthor(user) : undefined
      if (author) actors.push(author)
    }
  }
  const targetObjects = details?.target_objects
  let targetTweet: Tweet | undefined
  if (Array.isArray(targetObjects)) {
    for (const target of targetObjects) {
      const result = objectAt(target, 'tweet_results', 'result') ?? findTweetResult(target)
      if (!result) continue
      targetTweet = parseTweetResult(result)
      if (targetTweet) break
    }
  }
  const icon = objectAt(notification, 'notification_icon')
  return {
    id,
    timestamp: numberAt(notification, 'timestamp_ms'),
    kind: stringAt(icon, 'id') ?? stringAt(icon, 'name') ?? 'notification',
    message: stringAt(notification, 'rich_message', 'text') ?? '',
    actors,
    targetTweet,
    targetUserId: actors[0]?.id
  }
}

export function parseNotifications(value: unknown): NotificationPage {
  const notifications: NotificationItem[] = []
  const seen = new Set<string>()
  for (const entry of findEntries(value)) {
    if (!String(entry.entryId).startsWith('notification-')) continue
    const notification = parseNotificationEntry(entry)
    if (notification && !seen.has(notification.id)) {
      seen.add(notification.id)
      notifications.push(notification)
    }
  }
  return { notifications, nextCursor: findBottomCursor(value) }
}

export function parseSearch(value: unknown, people: boolean): SearchPage {
  if (!people) {
    const byId = new Map<string, Tweet>()
    for (const entry of findEntries(value)) {
      const entryId = String(entry.entryId)
      if (entryId.startsWith('cursor-') || entryId.startsWith('promoted-') || entryId.startsWith('relevanceprompt-')) continue
      for (const result of collectTweetResults(entry)) {
        const tweet = parseTweetResult(result)
        if (tweet && !byId.has(tweet.id)) byId.set(tweet.id, tweet)
      }
    }
    return { tweets: [...byId.values()], users: [], nextCursor: findBottomCursor(value) }
  }
  const users: ViewerProfile[] = []
  const seen = new Set<string>()
  for (const entry of findEntries(value)) {
    if (!String(entry.entryId).startsWith('user-')) continue
    let result: JsonObject | undefined
    visit(entry, (object) => {
      if (typeof object.rest_id === 'string' && isObject(object.core) && typeof object.core.screen_name === 'string') {
        result = object
        return true
      }
    })
    if (!result) continue
    const profile = parseUserProfileResult(result)
    if (!seen.has(profile.id)) {
      seen.add(profile.id)
      users.push(profile)
    }
  }
  return { tweets: [], users, nextCursor: findBottomCursor(value) }
}
