import { render, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { fetchNotifications } from '../api/client'
import { NotificationsScreen } from './NotificationsScreen'

vi.mock('../api/client', () => ({ fetchNotifications: vi.fn() }))

const settings = { baseUrl: 'http://relay.example', profileName: 'one' }

describe('NotificationsScreen', () => {
  it('keeps each notification tab loaded when switching back and forth', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue({ notifications: [] })
    const view = render(<NotificationsScreen settings={settings} tab="all" />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalledWith(settings, 'all', undefined, expect.any(AbortSignal)))

    view.rerender(<NotificationsScreen settings={settings} tab="mentions" />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalledWith(settings, 'mentions', undefined, expect.any(AbortSignal)))
    view.rerender(<NotificationsScreen settings={settings} tab="all" />)

    expect(fetchNotifications).toHaveBeenCalledTimes(2)
  })
})
