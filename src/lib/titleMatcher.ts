import Fuse from 'fuse.js'
import type { CollectionItem, MatchResult } from '../types'

const NOISE_PATTERNS = [
  /\b(widescreen|fullscreen|special|edition|extended|director'?s? cut|collector'?s?|blu[-\s]?ray|dvd|uhd|4k|hd|remastered)\b/gi,
  /\(\d{4}\)/g, // year like (2001)
  /[^\w\s'-]/g, // punctuation except hyphens and apostrophes
]

function normalize(title: string): string {
  let t = title.toLowerCase()
  for (const pattern of NOISE_PATTERNS) {
    t = t.replace(pattern, ' ')
  }
  return t.replace(/\s+/g, ' ').trim()
}

export function matchTitles(
  detectedTitles: string[],
  items: CollectionItem[]
): { matches: MatchResult[]; unmatched: string[] } {
  if (!items.length || !detectedTitles.length) {
    return { matches: [], unmatched: detectedTitles }
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    normalizedTitle: normalize(item.title),
  }))

  const fuse = new Fuse(normalizedItems, {
    keys: ['normalizedTitle'],
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 3,
    includeScore: true,
  })

  const matches: MatchResult[] = []
  const unmatched: string[] = []
  const matchedIds = new Set<string>()

  for (const detected of detectedTitles) {
    const normalizedDetected = normalize(detected)
    if (normalizedDetected.length < 3) {
      unmatched.push(detected)
      continue
    }

    const results = fuse.search(normalizedDetected)
    const best = results[0]

    if (best && !matchedIds.has(best.item.id)) {
      matchedIds.add(best.item.id)
      matches.push({
        detectedTitle: detected,
        // Strip the matcher's helper field so history stores a plain item
        item: { id: best.item.id, title: best.item.title, type: best.item.type, status: best.item.status, addedAt: best.item.addedAt },
        score: best.score ?? 1,
      })
    } else {
      unmatched.push(detected)
    }
  }

  return { matches, unmatched }
}
