import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CollectionItem, ItemStatus, MediaType } from '../types'
import { getCollection, saveCollection, generateId } from '../lib/storage'
import { addTitles } from '../lib/collection'

export function useCollection() {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCollection().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }, [])

  // Always read-modify-write from storage so rapid taps can't overwrite each other's changes
  const update = useCallback(async (change: (list: CollectionItem[]) => CollectionItem[]) => {
    const updated = change(await getCollection())
    await saveCollection(updated)
    setItems(updated)
  }, [])

  /** Adds new titles or moves existing ones to `status`; returns how many changed */
  const addMany = useCallback(
    async (titles: string[], type: MediaType, status: ItemStatus) => {
      let changed = 0
      await update((list) => {
        const result = addTitles(list, titles, type, status, generateId)
        changed = result.changed
        return result.list
      })
      return changed
    },
    [update]
  )

  const remove = useCallback(
    (id: string) => update((list) => list.filter((item) => item.id !== id)),
    [update]
  )

  const setStatus = useCallback(
    (id: string, status: ItemStatus) =>
      update((list) => list.map((item) => (item.id === id ? { ...item, status, addedAt: Date.now() } : item))),
    [update]
  )

  const wanted = useMemo(() => items.filter((i) => i.status === 'wanted'), [items])
  const owned = useMemo(() => items.filter((i) => i.status === 'owned'), [items])
  /** lower-cased title → item, for "already wanted/owned" checks */
  const byTitle = useMemo(() => new Map(items.map((i) => [i.title.toLowerCase(), i])), [items])
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  return { items, wanted, owned, byTitle, byId, loading, addMany, remove, setStatus }
}
