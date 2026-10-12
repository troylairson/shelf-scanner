import { get, set, del } from 'idb-keyval'
import type { WantedItem, ScanRecord, ScanResult } from '../types'

const WANTED_LIST_KEY = 'wanted-list'

export async function getWantedList(): Promise<WantedItem[]> {
  const list = await get<WantedItem[]>(WANTED_LIST_KEY)
  return list ?? []
}

export async function saveWantedList(items: WantedItem[]): Promise<void> {
  await set(WANTED_LIST_KEY, items)
}

export async function addWantedItem(item: WantedItem): Promise<WantedItem[]> {
  const list = await getWantedList()
  const updated = [...list, item]
  await saveWantedList(updated)
  return updated
}

export async function removeWantedItem(id: string): Promise<WantedItem[]> {
  const list = await getWantedList()
  const updated = list.filter((item) => item.id !== id)
  await saveWantedList(updated)
  return updated
}

export async function clearWantedList(): Promise<void> {
  await del(WANTED_LIST_KEY)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const SCAN_HISTORY_KEY = 'scan-history'
const MAX_HISTORY = 50

export async function getScanHistory(): Promise<ScanRecord[]> {
  return (await get<ScanRecord[]>(SCAN_HISTORY_KEY)) ?? []
}

export async function saveScanRecord(result: ScanResult): Promise<ScanRecord> {
  const record: ScanRecord = { ...result, id: generateId() }
  const history = await getScanHistory()
  const updated = [record, ...history].slice(0, MAX_HISTORY)
  await set(SCAN_HISTORY_KEY, updated)
  return record
}

export async function deleteScanRecord(id: string): Promise<ScanRecord[]> {
  const history = await getScanHistory()
  const updated = history.filter((r) => r.id !== id)
  await set(SCAN_HISTORY_KEY, updated)
  return updated
}

export async function clearScanHistory(): Promise<void> {
  await del(SCAN_HISTORY_KEY)
}
