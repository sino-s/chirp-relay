export interface RelaySettings {
  baseUrl: string
  profileName: string
}

export interface ViewerProfile {
  id: string
  name: string
  handle: string
  description: string
  avatarUrl: string
  bannerUrl?: string
  followers: number
  following: number
  posts: number
  likes: number
  joinedAt?: string
  protected?: boolean
  website?: {
    url: string
    displayUrl: string
  }
}

export interface TweetAuthor {
  id: string
  name: string
  handle: string
  avatarUrl: string
  verified: boolean
  protected?: boolean
}

export interface TweetMedia {
  id: string
  type: 'photo' | 'video' | 'animated_gif'
  previewUrl: string
  playbackUrl?: string
  playbackUrls?: string[]
  width?: number
  height?: number
  altText?: string
}

export interface TweetMetrics {
  replies: number
  reposts: number
  likes: number
  views?: number
}

export interface TweetLink {
  url: string
  expandedUrl: string
  displayUrl: string
}

export interface TweetLinkPreview {
  url: string
  title: string
  domain: string
  description?: string
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
}

export interface Tweet {
  id: string
  text: string
  author: TweetAuthor
  createdAt: string
  metrics: TweetMetrics
  media: TweetMedia[]
  links: TweetLink[]
  liked: boolean
  retweeted: boolean
  linkPreview?: TweetLinkPreview
  quotedTweet?: Tweet
  repostedBy?: string
  inReplyToId?: string
  url: string
}

export interface TimelinePage {
  tweets: Tweet[]
  nextCursor?: string
}

export interface TwitterList {
  id: string
  name: string
  description: string
  memberCount: number
  subscriberCount: number
  private: boolean
  pinned: boolean
  bannerUrl?: string
  owner?: {
    name: string
    handle: string
    avatarUrl: string
  }
}

export interface TwitterListPage {
  lists: TwitterList[]
  nextCursor?: string
}

export type TimelineKind = 'for-you' | 'following'

export interface ConversationPage {
  focalTweet?: Tweet
  ancestors: Tweet[]
  replies: Tweet[]
  nextCursor?: string
}

export interface NotificationItem {
  id: string
  timestamp: number
  kind: string
  message: string
  actors: TweetAuthor[]
  targetTweet?: Tweet
  targetUserId?: string
}

export interface NotificationPage {
  notifications: NotificationItem[]
  nextCursor?: string
}

export type SearchProduct = 'top' | 'latest' | 'people' | 'media'

export interface SearchPage {
  tweets: Tweet[]
  users: ViewerProfile[]
  nextCursor?: string
}
