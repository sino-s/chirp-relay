import type { JSX } from 'preact'
import { routeHref } from '../router'
import type { TweetLink, TweetMention } from '../types'

interface TextToken {
  start: number
  end: number
  kind: 'url' | 'hashtag' | 'mention'
  href: string
  label: string
}

const RAW_URL_PATTERN = /https?:\/\/[^\s<>"']+/giu
const HASHTAG_PATTERN = /[#＃][\p{L}\p{M}\p{N}_]+/gu
const MENTION_PATTERN = /@[A-Za-z0-9_]{1,15}/gu
const TRAILING_URL_PUNCTUATION = /[.,!?;:、。！？）\])}」』】]+$/u

function occurrences(text: string, value: string): number[] {
  const positions: number[] = []
  if (!value) return positions
  let offset = 0
  while (offset < text.length) {
    const position = text.indexOf(value, offset)
    if (position < 0) break
    positions.push(position)
    offset = position + value.length
  }
  return positions
}

function overlaps(token: TextToken, accepted: TextToken[]): boolean {
  return accepted.some((item) => token.start < item.end && token.end > item.start)
}

function textTokens(text: string, links: TweetLink[], mentions: TweetMention[]): TextToken[] {
  const candidates: TextToken[] = []
  for (const link of links) {
    const href = /^https?:\/\//i.test(link.expandedUrl) ? link.expandedUrl : link.url
    for (const start of occurrences(text, link.url)) {
      candidates.push({ start, end: start + link.url.length, kind: 'url', href, label: link.displayUrl })
    }
  }

  for (const match of text.matchAll(RAW_URL_PATTERN)) {
    if (match.index === undefined) continue
    const url = match[0].replace(TRAILING_URL_PUNCTUATION, '')
    if (!url) continue
    candidates.push({ start: match.index, end: match.index + url.length, kind: 'url', href: url, label: url })
  }

  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    if (match.index === undefined) continue
    const hashtag = match[0]
    candidates.push({
      start: match.index,
      end: match.index + hashtag.length,
      kind: 'hashtag',
      href: routeHref({ name: 'search', query: hashtag, product: 'top' }),
      label: hashtag
    })
  }

  const mentionedHandles = new Map(mentions.map((mention) => [mention.handle.toLowerCase(), mention.handle]))
  for (const match of text.matchAll(MENTION_PATTERN)) {
    if (match.index === undefined) continue
    const textHandle = match[0].slice(1)
    const handle = mentionedHandles.get(textHandle.toLowerCase())
    if (!handle) continue
    candidates.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: 'mention',
      href: routeHref({ name: 'user', handle }),
      label: match[0]
    })
  }

  const priority: Record<TextToken['kind'], number> = { url: 0, hashtag: 1, mention: 2 }
  candidates.sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start
    if (left.kind !== right.kind) return priority[left.kind] - priority[right.kind]
    return right.end - left.end
  })
  const accepted: TextToken[] = []
  for (const candidate of candidates) {
    if (!overlaps(candidate, accepted)) accepted.push(candidate)
  }
  return accepted.sort((left, right) => left.start - right.start)
}

export function TweetText({ text, links, mentions = [] }: { text: string; links: TweetLink[]; mentions?: TweetMention[] }): JSX.Element {
  const tokens = textTokens(text, links, mentions)
  const parts: JSX.Element[] = []
  let offset = 0
  for (const token of tokens) {
    if (token.start > offset) parts.push(<span key={`text-${offset}`}>{text.slice(offset, token.start)}</span>)
    parts.push(token.kind === 'url' ? (
      <a key={`url-${token.start}`} class="tweet-entity-link relative z-20" href={token.href} target="_blank" rel="noopener noreferrer">{token.label}</a>
    ) : (
      <a key={`${token.kind}-${token.start}`} class="tweet-entity-link relative z-20" href={token.href}>{token.label}</a>
    ))
    offset = token.end
  }
  if (offset < text.length || parts.length === 0) parts.push(<span key={`text-${offset}`}>{text.slice(offset)}</span>)
  return <>{parts}</>
}
