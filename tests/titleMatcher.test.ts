import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTitles } from '../src/lib/titleMatcher.ts'
import type { CollectionItem, ItemStatus } from '../src/types.ts'

const item = (id: string, title: string, status: ItemStatus = 'wanted'): CollectionItem =>
  ({ id, title, type: 'movie', status, addedAt: 0 })

test('matches through edition noise and years', () => {
  const items = [item('1', 'The Matrix'), item('2', 'Alien')]
  const { matches, unmatched } = matchTitles(['The Matrix (1999) Special Edition Blu-ray', 'Halo 3'], items)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].item.id, '1')
  assert.deepEqual(unmatched, ['Halo 3'])
})

test('each item matches at most once', () => {
  const { matches, unmatched } = matchTitles(['Alien', 'Alien DVD'], [item('1', 'Alien')])
  assert.equal(matches.length, 1)
  assert.deepEqual(unmatched, ['Alien DVD'])
})

test('matches wanted and owned items in one pass, keeping each status', () => {
  const items = [item('1', 'Heat', 'wanted'), item('2', 'Fargo', 'owned')]
  const { matches, unmatched } = matchTitles(['Fargo', 'Heat', 'Jaws'], items)
  assert.deepEqual(matches.map((m) => [m.item.title, m.item.status]), [['Fargo', 'owned'], ['Heat', 'wanted']])
  assert.deepEqual(unmatched, ['Jaws'])
})

test('matched items are stored without matcher internals', () => {
  const { matches } = matchTitles(['Heat'], [item('1', 'Heat')])
  assert.deepEqual(Object.keys(matches[0].item).sort(), ['addedAt', 'id', 'status', 'title', 'type'])
})

test('empty collection leaves everything unmatched', () => {
  assert.deepEqual(matchTitles(['Heat'], []), { matches: [], unmatched: ['Heat'] })
})
