import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { CollectionItem, ItemStatus, MatchResult, MediaType, ScanResult } from '../types'
import { useTheme } from '../theme'
import { formatDate, plural } from '../lib/format'
import { EmptyState, Group, PillButton, PrimaryButton, SectionHeader, Segmented, Separator, TYPE_LABELS } from './ui'

interface Props {
  result: ScanResult
  byId: Map<string, CollectionItem>
  byTitle: Map<string, CollectionItem>
  backLabel: string
  onBack: () => void
  onScanAgain: () => void
  onAdd: (titles: string[], type: MediaType, status: ItemStatus) => Promise<number>
  onSetStatus: (id: string, status: ItemStatus) => void
}

function percent(m: MatchResult) {
  return `${Math.round((1 - m.score) * 100)}%`
}

export function ResultsScreen({ result, byId, byTitle, backLabel, onBack, onScanAgain, onAdd, onSetStatus }: Props) {
  const c = useTheme()
  const [selecting, setSelecting] = useState(false)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [libraryType, setLibraryType] = useState<MediaType>('movie')

  const { detectedTitles, unmatched } = result
  const found = detectedTitles.length
  // Split by the status each item had when the scan ran, so a scan reads the same later
  const wantedMatches = result.matches.filter((m) => m.item.status === 'wanted')
  const ownedMatches = result.matches.filter((m) => m.item.status === 'owned')
  const hit = wantedMatches.length > 0

  // Titles from this shelf not yet in the collection: candidates for "Add all to Library"
  const candidates = unmatched.filter((t) => !byTitle.has(t.toLowerCase()))
  const chosen = candidates.filter((t) => !skipped.has(t))

  function startSelecting() {
    setSkipped(new Set())
    setSelecting(true)
  }

  function toggle(title: string) {
    setSkipped((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  async function addChosen() {
    await onAdd(chosen, libraryType, 'owned')
    setSelecting(false)
  }

  if (found === 0) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <NavBar backLabel={backLabel} onBack={onBack} scannedAt={result.scannedAt} />
        <View style={styles.flex}>
          <EmptyState
            icon="search-outline"
            title="No titles found"
            body="Try again closer to the shelf, in good light, with the spines facing the camera."
          />
        </View>
        <View style={styles.footer}>
          <PrimaryButton label="Try again" onPress={onScanAgain} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <NavBar backLabel={backLabel} onBack={onBack} scannedAt={result.scannedAt} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {!selecting && (
          <View style={[styles.summary, { backgroundColor: hit ? c.accentFill : c.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: hit ? 'rgba(255,255,255,0.18)' : c.fill }]}>
              <Ionicons name={hit ? 'checkmark' : 'remove'} size={30} color={hit ? '#ffffff' : c.textTertiary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.summaryTitle, { color: hit ? '#ffffff' : c.text }]}>
                {hit ? `${wantedMatches.length} on your list` : 'No matches'}
              </Text>
              <Text style={[styles.summaryBody, { color: hit ? 'rgba(255,255,255,0.92)' : c.textSecondary }]}>
                {plural(found, 'title')} found{ownedMatches.length ? ` · ${ownedMatches.length} you own` : ''}
              </Text>
            </View>
          </View>
        )}

        {!selecting && hit && (
          <View>
            <SectionHeader>On your list</SectionHeader>
            <Group>
              {wantedMatches.map((m, i) => {
                const gotIt = byId.get(m.item.id)?.status === 'owned'
                return (
                  <View key={m.item.id}>
                    {i > 0 && <Separator />}
                    <View style={styles.row}>
                      <View style={[styles.tile, { backgroundColor: c.accentTint }]}>
                        <Ionicons name="checkmark" size={17} color={c.accent} />
                      </View>
                      <View style={styles.flex}>
                        <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>{m.item.title}</Text>
                        <Text numberOfLines={1} style={[styles.rowSub, { color: c.textTertiary }]}>
                          {TYPE_LABELS[m.item.type]} · {percent(m)}
                          {m.detectedTitle.toLowerCase() !== m.item.title.toLowerCase() ? ` · seen as “${m.detectedTitle}”` : ''}
                        </Text>
                      </View>
                      <PillButton
                        label="Got it"
                        doneLabel="Owned"
                        done={gotIt}
                        accessibilityLabel={`Got ${m.item.title}: move it to your Library`}
                        onPress={() => onSetStatus(m.item.id, 'owned')}
                      />
                    </View>
                  </View>
                )
              })}
            </Group>
          </View>
        )}

        {!selecting && ownedMatches.length > 0 && (
          <View>
            <SectionHeader>Already own</SectionHeader>
            <Group>
              {ownedMatches.map((m, i) => (
                <View key={m.item.id}>
                  {i > 0 && <Separator />}
                  <View style={styles.row}>
                    <View style={[styles.tile, { backgroundColor: c.fill }]}>
                      <Ionicons name="library" size={15} color={c.textSecondary} />
                    </View>
                    <View style={styles.flex}>
                      <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>{m.item.title}</Text>
                      <Text numberOfLines={1} style={[styles.rowSub, { color: c.textTertiary }]}>
                        {TYPE_LABELS[m.item.type]} · {percent(m)}
                        {m.detectedTitle.toLowerCase() !== m.item.title.toLowerCase() ? ` · seen as “${m.detectedTitle}”` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.ownedTag, { color: c.textSecondary }]}>Owned</Text>
                  </View>
                </View>
              ))}
            </Group>
          </View>
        )}

        {unmatched.length > 0 && (
          <View>
            <SectionHeader
              action={
                selecting
                  ? { label: 'Cancel', onPress: () => setSelecting(false) }
                  : candidates.length > 1
                    ? { label: 'Add all to Library', onPress: startSelecting }
                    : undefined
              }
            >
              {selecting ? 'Add to Library' : hit || ownedMatches.length ? 'Also on the shelf' : 'On the shelf'}
            </SectionHeader>
            {selecting && (
              <Text style={[styles.hint, { color: c.textSecondary }]}>Untick anything that was misread.</Text>
            )}
            <Group>
              {(selecting ? candidates : unmatched).map((title, i) => {
                const existing = byTitle.get(title.toLowerCase())
                return (
                  <View key={`${title}-${i}`}>
                    {i > 0 && <Separator />}
                    {selecting ? (
                      <Pressable
                        onPress={() => toggle(title)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: !skipped.has(title) }}
                        style={[styles.row, styles.rowCompact]}
                      >
                        <Ionicons
                          name={skipped.has(title) ? 'ellipse-outline' : 'checkmark-circle'}
                          size={24}
                          color={skipped.has(title) ? c.textTertiary : c.accent}
                        />
                        <Text numberOfLines={1} style={[styles.flex, styles.plain, { color: c.text }]}>{title}</Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.row, styles.rowCompact]}>
                        <Text numberOfLines={1} style={[styles.flex, styles.plain, { color: c.text }]}>{title}</Text>
                        {existing ? (
                          <PillButton label="" done doneLabel={existing.status === 'owned' ? 'Owned' : 'Wanted'} onPress={() => {}} />
                        ) : (
                          <View style={styles.pills}>
                            <PillButton label="Want" accessibilityLabel={`Want ${title}`} onPress={() => onAdd([title], 'other', 'wanted')} />
                            <PillButton label="Own" tone="neutral" accessibilityLabel={`Own ${title}`} onPress={() => onAdd([title], 'other', 'owned')} />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )
              })}
            </Group>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, selecting && { gap: 10 }]}>
        {selecting ? (
          <>
            <Text style={[styles.addAs, { color: c.textSecondary }]}>Add as</Text>
            <Segmented value={libraryType} onChange={setLibraryType} />
            <PrimaryButton
              label={chosen.length ? `Add ${plural(chosen.length, 'title')} to Library` : 'Nothing selected'}
              onPress={chosen.length ? addChosen : () => setSelecting(false)}
            />
          </>
        ) : (
          <PrimaryButton label="Scan another shelf" onPress={onScanAgain} />
        )}
      </View>
    </View>
  )
}

function NavBar({ backLabel, onBack, scannedAt }: { backLabel: string; onBack: () => void; scannedAt: number }) {
  const c = useTheme()
  return (
    <View style={styles.nav}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={c.accent} />
        <Text style={[styles.backText, { color: c.accent }]}>{backLabel}</Text>
      </Pressable>
      <Text style={[styles.time, { color: c.textSecondary }]}>{formatDate(scannedAt)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  backText: { fontSize: 17, fontWeight: '500' },
  time: { fontSize: 13, paddingRight: 4 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 22 },
  summary: { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  summaryBody: { fontSize: 14, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowCompact: { paddingVertical: 8, paddingRight: 10, minHeight: 52 },
  tile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 1 },
  ownedTag: { fontSize: 13, fontWeight: '600', paddingRight: 6 },
  plain: { fontSize: 16 },
  pills: { flexDirection: 'row', gap: 6 },
  hint: { fontSize: 14, paddingHorizontal: 4, paddingBottom: 8, marginTop: -2 },
  addAs: { fontSize: 13, fontWeight: '600', paddingLeft: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
})
