export type TwitterImageSize = 'small' | 'medium' | 'large' | 'orig'

export function twitterImageUrl(url: string, size: TwitterImageSize): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('name', size)
    return parsed.toString()
  } catch {
    return url
  }
}
