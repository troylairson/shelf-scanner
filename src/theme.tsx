import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { getStoredTheme, setStoredTheme } from './lib/storage'

export type ThemeName = 'light' | 'dark'

const INK = '#0a0a0a'
const PAPER = '#f5f5f0'

export const PUNCH = '#5B9CF6' // bold sky blue — the pop color
export const DANGER = '#ef4444'
export const TYPE_COLORS = { movie: '#3b82f6', tv: '#a855f7', game: '#f97316' } as const

export interface Palette {
  name: ThemeName
  bg: string
  fg: string
  card: string
  input: string
  /** fg at a given opacity, e.g. muted(0.4) */
  muted: (alpha: number) => string
  /** hard offset shadow (neo-brutalist) */
  shadow: string
  shadowSm: string
}

function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const PALETTES: Record<ThemeName, Palette> = {
  light: {
    name: 'light',
    bg: PAPER,
    fg: INK,
    card: '#ffffff',
    input: '#ffffff',
    muted: (a) => alpha(INK, a),
    shadow: `4px 4px 0px ${INK}`,
    shadowSm: `2px 2px 0px ${INK}`,
  },
  dark: {
    name: 'dark',
    bg: INK,
    fg: PAPER,
    card: '#18181b',
    input: '#18181b',
    muted: (a) => alpha(PAPER, a),
    shadow: '4px 4px 0px rgba(255,255,255,0.15)',
    shadowSm: '2px 2px 0px rgba(255,255,255,0.15)',
  },
}

export const INK_COLOR = INK
export const PAPER_COLOR = PAPER

interface ThemeContextValue {
  colors: Palette
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [override, setOverride] = useState<ThemeName | null>(null)

  useEffect(() => {
    getStoredTheme().then((t) => {
      if (t === 'light' || t === 'dark') setOverride(t)
    })
  }, [])

  const name: ThemeName = override ?? (system === 'dark' ? 'dark' : 'light')

  const toggle = useCallback(() => {
    const next = name === 'dark' ? 'light' : 'dark'
    setOverride(next)
    setStoredTheme(next).catch(() => {})
  }, [name])

  const value = useMemo(() => ({ colors: PALETTES[name], toggle }), [name, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
