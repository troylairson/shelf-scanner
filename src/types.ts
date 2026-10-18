export type MediaType = 'movie' | 'tv' | 'game' | 'other'

export interface WantedItem {
  id: string
  title: string
  type: MediaType
  addedAt: number
}

export interface MatchResult {
  detectedTitle: string
  wantedItem: WantedItem
  score: number // 0 = perfect match, 1 = worst
}

export interface ScanResult {
  detectedTitles: string[]
  matches: MatchResult[]
  unmatched: string[]
  scannedAt: number
}

export interface ScanRecord extends ScanResult {
  id: string
}

export type AppView = 'scanner' | 'results' | 'wanted-list' | 'history'
