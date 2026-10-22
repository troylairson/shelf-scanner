export type MediaType = 'movie' | 'tv' | 'game' | 'other'

export type ItemStatus = 'wanted' | 'owned'

/** A title you're hunting for (wanted) or already have (owned) */
export interface CollectionItem {
  id: string
  title: string
  type: MediaType
  status: ItemStatus
  addedAt: number
}

export interface MatchResult {
  detectedTitle: string
  /** Snapshot of the item when the scan ran; look up the live item by id for its current status */
  item: CollectionItem
  score: number // 0 = perfect match, 1 = worst
}

export interface ScanResult {
  detectedTitles: string[]
  /** Matches against wanted and owned items; split them by item.status */
  matches: MatchResult[]
  unmatched: string[]
  scannedAt: number
}

export interface ScanRecord extends ScanResult {
  id: string
}

export type AppView = 'scanner' | 'results' | 'wanted-list' | 'library' | 'history'
