import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { TweetText } from './TweetText'

describe('TweetText', () => {
  it('expands entity URLs and leaves surrounding text intact', () => {
    const { container } = render(<p><TweetText text="before https://t.co/abc after" links={[{
      url: 'https://t.co/abc',
      expandedUrl: 'https://example.com/article',
      displayUrl: 'example.com/article'
    }]} /></p>)
    const link = screen.getByRole('link', { name: 'example.com/article' })
    expect(link).toHaveAttribute('href', 'https://example.com/article')
    expect(link).toHaveAttribute('target', '_blank')
    expect(container).toHaveTextContent('before example.com/article after')
  })

  it('links raw URLs without including trailing punctuation', () => {
    render(<TweetText text="https://example.com/path。" links={[]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/path')
  })

  it('routes Japanese and full-width hashtags to top search', () => {
    render(<TweetText text="#猫 と ＃写真 https://example.com/#fragment" links={[]} />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '#/search?q=%23%E7%8C%AB&tab=top')
    expect(links[1]).toHaveAttribute('href', '#/search?q=%EF%BC%83%E5%86%99%E7%9C%9F&tab=top')
    expect(links).toHaveLength(3)
  })
})
