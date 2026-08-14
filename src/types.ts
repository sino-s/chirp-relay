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
  joinedAt?: string
}

export interface TweetAuthor {
  id: string
  name: string
  handle: string
  avatarUrl: string
  verified: boolean
}

export interface TweetMedia {
  id: string
  type: 'photo' | 'video' | 'animated_gif'
  previewUrl: string
  playbackUrl?: string
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

export interface Tweet {
  id: string
  text: string
  author: TweetAuthor
  createdAt: string
  metrics: TweetMetrics
  media: TweetMedia[]
  links: TweetLink[]
  quotedTweet?: Tweet
  repostedBy?: string
  url: string
}

export interface TimelinePage {
  tweets: Tweet[]
  nextCursor?: string
}

export type TimelineKind = 'for-you' | 'following'
