import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CollectionItem, MatchResult, ScanRecord, ScanResult } from '../types'

const COLLECTION_KEY = 'collection'
const LEGACY_WANTED_KEY = 'wanted-list'
const SCAN_HISTORY_KEY = 'scan-history'
const MAX_HISTORY = 50

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setJSON(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function getCollection(): Promise<CollectionItem[]> {
  const stored = await getJSON<CollectionItem[] | null>(COLLECTION_KEY, null)
  if (stored) return stored
  // First run after the Library was added: carry the old wanted list over.
  // The legacy key is left in place so nothing is lost if this ever needs redoing.
  const legacy = await getJSON<Omit<CollectionItem, 'status'>[]>(LEGACY_WANTED_KEY, [])
  const migrated = legacy.map((item) => ({ ...item, status: 'wanted' as const }))
  await setJSON(COLLECTION_KEY, migrated)
  return migrated
}

export function saveCollection(items: CollectionItem[]): Promise<void> {
  return setJSON(COLLECTION_KEY, items)
}

// Records saved before the Library existed stored matches as { wantedItem } with no status
type LegacyMatch = Omit<MatchResult, 'item'> & { wantedItem?: Omit<CollectionItem, 'status'>; item?: CollectionItem }

function upgradeRecord(record: ScanRecord): ScanRecord {
  return {
    ...record,
    matches: (record.matches as LegacyMatch[]).map(({ wantedItem, item, ...rest }) => ({
      ...rest,
      item: item ?? { ...(wantedItem as Omit<CollectionItem, 'status'>), status: 'wanted' },
    })),
  }
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  return (await getJSON<ScanRecord[]>(SCAN_HISTORY_KEY, [])).map(upgradeRecord)
}

export async function saveScanRecord(result: ScanResult): Promise<ScanRecord[]> {
  const record: ScanRecord = { ...result, id: generateId() }
  const updated = [record, ...(await getScanHistory())].slice(0, MAX_HISTORY)
  await setJSON(SCAN_HISTORY_KEY, updated)
  return updated
}

export async function deleteScanRecord(id: string): Promise<ScanRecord[]> {
  const updated = (await getScanHistory()).filter((r) => r.id !== id)
  await setJSON(SCAN_HISTORY_KEY, updated)
  return updated
}

export function clearScanHistory(): Promise<void> {
  return AsyncStorage.removeItem(SCAN_HISTORY_KEY)
}
