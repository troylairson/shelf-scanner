import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTitles } from '../src/lib/titleMatcher.ts'
import type { WantedItem } from '../src/types.ts'

const item = (id: string, title: string): WantedItem => ({ id, title, type: 'movie', addedAt: 0 })

test('matches through edition noise and years', () => {
  const wanted = [item('1', 'The Matrix'), item('2', 'Alien')]
  const { matches, unmatched } = matchTitles(['The Matrix (1999) Special Edition Blu-ray', 'Halo 3'], wanted)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].wantedItem.id, '1')
  assert.deepEqual(unmatched, ['Halo 3'])
})

test('each wanted item matches at most once', () => {
  const { matches, unmatched } = matchTitles(['Alien', 'Alien DVD'], [item('1', 'Alien')])
  assert.equal(matches.length, 1)
  assert.deepEqual(unmatched, ['Alien DVD'])
})

test('empty wanted list leaves everything unmatched', () => {
  assert.deepEqual(matchTitles(['Heat'], []), { matches: [], unmatched: ['Heat'] })
})
