import { useState, useEffect, useCallback } from 'react'
import type { WantedItem, MediaType } from '../types'
import {
  getWantedList,
  saveWantedList,
  addWantedItem,
  removeWantedItem,
  generateId,
} from '../utils/storage'

export function useWantedList() {
  const [items, setItems] = useState<WantedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWantedList().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }, [])

  const add = useCallback(async (title: string, type: MediaType = 'other') => {
    const item: WantedItem = { id: generateId(), title: title.trim(), type, addedAt: Date.now() }
    const updated = await addWantedItem(item)
    setItems(updated)
    return item
  }, [])

  const remove = useCallback(async (id: string) => {
    const updated = await removeWantedItem(id)
    setItems(updated)
  }, [])

  const importTitles = useCallback(async (titles: string[], type: MediaType = 'other') => {
    const list = await getWantedList()
    const existingTitles = new Set(list.map((i) => i.title.toLowerCase()))
    const newItems: WantedItem[] = titles
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !existingTitles.has(t.toLowerCase()))
      .map((title) => ({ id: generateId(), title, type, addedAt: Date.now() }))
    const updated = [...list, ...newItems]
    await saveWantedList(updated)
    setItems(updated)
    return newItems.length
  }, [])

  return { items, loading, add, remove, importTitles }
}
