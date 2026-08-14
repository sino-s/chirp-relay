import { createContext } from 'preact'
import type { RelaySettings } from './types'

export const RelaySettingsContext = createContext<RelaySettings | undefined>(undefined)
