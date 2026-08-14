import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { createTweet } from '../api/client'
import { Composer } from './Composer'

vi.mock('../api/client', () => ({ createTweet: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }

describe('Composer', () => {
  it('submits a text-only tweet and returns its id', async () => {
    vi.mocked(createTweet).mockResolvedValue('new-tweet')
    const onPosted = vi.fn()
    render(<Composer settings={settings} onClose={() => undefined} onPosted={onPosted} />)

    fireEvent.input(screen.getByRole('textbox', { name: 'ポスト本文' }), { target: { value: '  hello  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'ポストする' }))

    await waitFor(() => expect(createTweet).toHaveBeenCalledWith(settings, 'hello'))
    expect(onPosted).toHaveBeenCalledWith('new-tweet')
  })
})
