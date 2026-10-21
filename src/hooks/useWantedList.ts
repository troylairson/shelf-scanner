import { useState, useEffect, useCallback } from 'react'
import type { WantedItem, MediaType } from '../types'
import { getWantedList, saveWantedList, generateId } from '../lib/storage'

export function useWantedList() {
  const [items, setItems] = useState<WantedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWantedList().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }, [])

  // Adds titles not already on the list (case-insensitive); returns how many were new
  const addMany = useCallback(async (titles: string[], type: MediaType = 'other') => {
    const list = await getWantedList()
    const existing = new Set(list.map((i) => i.title.toLowerCase()))
    const newItems: WantedItem[] = []
    for (const raw of titles) {
      const title = raw.trim()
      if (!title || existing.has(title.toLowerCase())) continue
      existing.add(title.toLowerCase())
      newItems.push({ id: generateId(), title, type, addedAt: Date.now() })
    }
    if (newItems.length) {
      const updated = [...list, ...newItems]
      await saveWantedList(updated)
      setItems(updated)
    }
    return newItems.length
  }, [])

  const add = useCallback(
    (title: string, type: MediaType = 'other') => addMany([title], type),
    [addMany]
  )

  const remove = useCallback(async (id: string) => {
    const updated = (await getWantedList()).filter((item) => item.id !== id)
    await saveWantedList(updated)
    setItems(updated)
  }, [])

  return { items, loading, add, addMany, remove }
}
