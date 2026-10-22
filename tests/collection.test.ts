import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTitles, countByType } from '../src/lib/collection.ts'
import type { CollectionItem } from '../src/types.ts'

let n = 0
const id = () => `id${++n}`

test('adds new titles, trimming blanks and skipping duplicates within the batch', () => {
  const { list, changed } = addTitles([], ['Heat', ' ', 'heat', 'Alien '], 'movie', 'owned', id, 5)
  assert.equal(changed, 2)
  assert.deepEqual(list.map((i) => [i.title, i.status, i.addedAt]), [['Heat', 'owned', 5], ['Alien', 'owned', 5]])
})

test('an existing title with the same status is left alone', () => {
  const start: CollectionItem[] = [{ id: 'a', title: 'Heat', type: 'movie', status: 'wanted', addedAt: 1 }]
  const { list, changed } = addTitles(start, ['HEAT'], 'game', 'wanted', id, 9)
  assert.equal(changed, 0)
  assert.deepEqual(list, start)
})

test('an existing title is moved to the new status, never duplicated', () => {
  const start: CollectionItem[] = [{ id: 'a', title: 'Heat', type: 'movie', status: 'wanted', addedAt: 1 }]
  const { list, changed } = addTitles(start, ['heat'], 'other', 'owned', id, 9)
  assert.equal(changed, 1)
  assert.deepEqual(list, [{ id: 'a', title: 'Heat', type: 'movie', status: 'owned', addedAt: 9 }])
})

test('countByType tallies each media type', () => {
  const items = addTitles([], ['A', 'B'], 'movie', 'owned', id).list.concat(addTitles([], ['C'], 'game', 'owned', id).list)
  assert.deepEqual(countByType(items), { movie: 2, tv: 0, game: 1, other: 0 })
})
