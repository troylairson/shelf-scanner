import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bytesToBase64, parseTitles } from '../worker/src/scan.ts'

test('bytesToBase64 handles images far beyond the argument-spread limit', () => {
  const bytes = new Uint8Array(600_000)
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) & 255
  assert.equal(bytesToBase64(bytes), Buffer.from(bytes).toString('base64'))
})

test('parseTitles extracts the array from chatty output', () => {
  assert.deepEqual(parseTitles('Sure! ```json\n["Alien", "Heat"]\n```'), ['Alien', 'Heat'])
})

test('parseTitles drops non-strings, blanks and duplicates', () => {
  assert.deepEqual(parseTitles('["Alien", 3, "", " alien ", null, "Heat"]'), ['Alien', 'Heat'])
})

test('parseTitles returns [] for garbage', () => {
  assert.deepEqual(parseTitles('no titles here'), [])
  assert.deepEqual(parseTitles('[not json'), [])
})
