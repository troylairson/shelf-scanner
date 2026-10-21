import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import type { MediaType } from './types'

export type ThemeName = 'light' | 'dark'

export interface Palette {
  name: ThemeName
  /** grouped background behind cards */
  bg: string
  card: string
  text: string
  textSecondary: string
  textTertiary: string
  /** between rows inside a card */
  separator: string
  /** tab bar top border */
  hairline: string
  /** round icon buttons, search field */
  fill: string
  /** "match" green for text and icons */
  accent: string
  /** green behind white text (summary card) */
  accentFill: string
  /** pale green behind accent text (check tiles, Add pills) */
  accentTint: string
  /** dark primary button */
  primary: string
  onPrimary: string
  danger: string
  dangerTint: string
  camera: string
  typeColors: Record<MediaType, string>
}

const LIGHT: Palette = {
  name: 'light',
  bg: '#f4f5f7',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#4b5563',
  textTertiary: '#6b7280',
  separator: '#f0f1f3',
  hairline: '#e5e7eb',
  fill: '#e5e7eb',
  accent: '#15803d',
  accentFill: '#15803d',
  accentTint: '#dcfce7',
  primary: '#111827',
  onPrimary: '#ffffff',
  danger: '#b91c1c',
  dangerTint: '#fee2e2',
  camera: '#1c1d21',
  typeColors: { movie: '#1d4ed8', tv: '#7e22ce', game: '#c2410c', other: '#4b5563' },
}

const DARK: Palette = {
  name: 'dark',
  bg: '#000000',
  card: '#1c1c1e',
  text: '#f5f5f7',
  textSecondary: '#aeaeb2',
  textTertiary: '#8e8e93',
  separator: '#2c2c2e',
  hairline: '#38383a',
  fill: '#2c2c2e',
  accent: '#4ade80',
  accentFill: '#15803d',
  accentTint: 'rgba(74, 222, 128, 0.16)',
  primary: '#f5f5f7',
  onPrimary: '#111827',
  danger: '#f87171',
  dangerTint: 'rgba(248, 113, 113, 0.16)',
  camera: '#1c1d21',
  typeColors: { movie: '#93c5fd', tv: '#d8b4fe', game: '#fdba74', other: '#aeaeb2' },
}

const ThemeContext = createContext<Palette>(LIGHT)

// Follows the phone's light/dark setting, like a built-in app
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme()
  const palette = useMemo(() => (scheme === 'dark' ? DARK : LIGHT), [scheme])
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>
}

export function useTheme(): Palette {
  return useContext(ThemeContext)
}
