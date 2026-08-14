import type { TimelinePage, Tweet, TweetAuthor, TweetLink, TweetMedia, ViewerProfile } from '../types'

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

function parseAuthor(result: JsonObject): TweetAuthor | undefined {
  const user = objectAt(result, 'core', 'user_results', 'result')
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
    verified: booleanAt(user, 'is_blue_verified') || booleanAt(user, 'verification', 'verified')
  }
}

function parseLinks(legacy: JsonObject): TweetLink[] {
  const raw = objectAt(legacy, 'entities')?.urls
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
    if (Array.isArray(variants)) {
      let bestBitrate = -1
      for (const variant of variants) {
        if (!isObject(variant) || variant.content_type !== 'video/mp4' || typeof variant.url !== 'string') continue
        const bitrate = typeof variant.bitrate === 'number' ? variant.bitrate : 0
        if (bitrate > bestBitrate) {
          bestBitrate = bitrate
          playbackUrl = variant.url
        }
      }
    }
    return [{
      id: item.id_str,
      type,
      previewUrl: item.media_url_https,
      playbackUrl,
      width: numberAt(item, 'original_info', 'width') || undefined,
      height: numberAt(item, 'original_info', 'height') || undefined,
      altText: typeof item.ext_alt_text === 'string' ? item.ext_alt_text : undefined
    }]
  })
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

function parseTweetResult(result: JsonObject, depth = 0): Tweet | undefined {
  if (depth > 1) return undefined
  const wrapperLegacy = objectAt(result, 'legacy')
  if (!wrapperLegacy) return undefined
  const retweeted = objectAt(wrapperLegacy, 'retweeted_status_result', 'result')
  const source = retweeted ? findTweetResult(retweeted) ?? result : result
  const legacy = objectAt(source, 'legacy')
  const author = parseAuthor(source)
  const id = stringAt(source, 'rest_id')
  if (!legacy || !author || !id) return undefined

  const links = parseLinks(legacy)
  const media = parseMedia(legacy)
  const noteText = stringAt(source, 'note_tweet', 'note_tweet_results', 'result', 'text')
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
    quotedTweet: quotedSource ? parseTweetResult(quotedSource, depth + 1) : undefined,
    repostedBy: wrapperAuthor?.name,
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
    if (entryId.startsWith('promoted-') || !entryId.startsWith('tweet-')) continue
    const result = findTweetResult(entry)
    if (!result) continue
    const tweet = parseTweetResult(result)
    if (tweet && !byId.has(tweet.id)) byId.set(tweet.id, tweet)
  }
  return { tweets: [...byId.values()], nextCursor: findBottomCursor(value) }
}

export function parseViewer(value: unknown): ViewerProfile {
  const result = objectAt(value, 'data', 'viewer', 'user_results', 'result')
  if (!result) throw new Error('プロフィール情報を読み取れませんでした。')
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
    joinedAt: stringAt(result, 'core', 'created_at')
  }
}
