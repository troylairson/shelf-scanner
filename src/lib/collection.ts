import type { CollectionItem, ItemStatus, MediaType } from '../types'

/**
 * Adds titles with the given status. A title already in the collection (case-insensitive)
 * is moved to that status instead of duplicated, so a title is never both wanted and owned.
 * Returns the new list and how many titles were added or moved.
 */
export function addTitles(
  list: CollectionItem[],
  titles: string[],
  type: MediaType,
  status: ItemStatus,
  makeId: () => string,
  now = Date.now()
): { list: CollectionItem[]; changed: number } {
  const byTitle = new Map(list.map((item) => [item.title.toLowerCase(), item]))
  const moved = new Set<string>()
  const added: CollectionItem[] = []

  for (const raw of titles) {
    const title = raw.trim()
    const key = title.toLowerCase()
    if (!title) continue
    const existing = byTitle.get(key)
    if (existing) {
      if (existing.status !== status) moved.add(existing.id)
      continue
    }
    const item: CollectionItem = { id: makeId(), title, type, status, addedAt: now }
    byTitle.set(key, item)
    added.push(item)
  }

  const updated = list.map((item) => (moved.has(item.id) ? { ...item, status, addedAt: now } : item))
  return { list: [...updated, ...added], changed: added.length + moved.size }
}

export function countByType(items: CollectionItem[]): Record<MediaType, number> {
  const counts: Record<MediaType, number> = { movie: 0, tv: 0, game: 0, other: 0 }
  for (const item of items) counts[item.type]++
  return counts
}
