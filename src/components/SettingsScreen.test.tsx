import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { SettingsScreen } from './SettingsScreen'

describe('SettingsScreen', () => {
  it('keeps relay URL configuration separate from account selection', () => {
    render(<SettingsScreen initial={{ baseUrl: 'http://localhost:4545', profileName: 'profile-one' }} onSave={() => undefined} />)
    expect(screen.getByRole('textbox', { name: 'Relay URL' })).toHaveValue('http://localhost:4545')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Relay URLを保存' })).toBeInTheDocument()
  })
})
