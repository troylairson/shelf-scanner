import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WantedItem, ScanRecord, ScanResult } from '../types'

const WANTED_LIST_KEY = 'wanted-list'
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

export function getWantedList(): Promise<WantedItem[]> {
  return getJSON<WantedItem[]>(WANTED_LIST_KEY, [])
}

export function saveWantedList(items: WantedItem[]): Promise<void> {
  return setJSON(WANTED_LIST_KEY, items)
}

export function getScanHistory(): Promise<ScanRecord[]> {
  return getJSON<ScanRecord[]>(SCAN_HISTORY_KEY, [])
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

export function getStoredTheme(): Promise<string | null> {
  return AsyncStorage.getItem('theme').catch(() => null)
}

export function setStoredTheme(theme: string): Promise<void> {
  return AsyncStorage.setItem('theme', theme)
}
