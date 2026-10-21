import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ScanResult } from '../types'
import { useTheme } from '../theme'
import { EmptyState, Group, PillButton, PrimaryButton, SectionHeader, Separator, TYPE_LABELS } from './ui'
import { formatDate } from '../lib/format'

interface Props {
  result: ScanResult
  wantedTitles: Set<string>
  backLabel: string
  onBack: () => void
  onScanAgain: () => void
  onAddToWanted: (title: string) => void
}

export function ResultsScreen({ result, wantedTitles, backLabel, onBack, onScanAgain, onAddToWanted }: Props) {
  const c = useTheme()
  const { matches, unmatched, detectedTitles } = result
  const found = detectedTitles.length
  const hit = matches.length > 0

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.nav}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={c.accent} />
          <Text style={[styles.backText, { color: c.accent }]}>{backLabel}</Text>
        </Pressable>
        <Text style={[styles.time, { color: c.textSecondary }]}>{formatDate(result.scannedAt)}</Text>
      </View>

      {found === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            icon="search-outline"
            title="No titles found"
            body="Try again closer to the shelf, in good light, with the spines facing the camera."
          />
          <View style={styles.footer}>
            <PrimaryButton label="Try again" onPress={onScanAgain} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={[styles.summary, { backgroundColor: hit ? c.accentFill : c.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: hit ? 'rgba(255,255,255,0.18)' : c.fill }]}>
                <Ionicons name={hit ? 'checkmark' : 'remove'} size={30} color={hit ? '#ffffff' : c.textTertiary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.summaryTitle, { color: hit ? '#ffffff' : c.text }]}>
                  {hit ? `${matches.length} on your list` : 'No matches'}
                </Text>
                <Text style={[styles.summaryBody, { color: hit ? 'rgba(255,255,255,0.92)' : c.textSecondary }]}>
                  {found} title{found === 1 ? '' : 's'} found on this shelf
                </Text>
              </View>
            </View>

            {hit && (
              <View>
                <SectionHeader>Matches</SectionHeader>
                <Group>
                  {matches.map((m, i) => (
                    <View key={m.wantedItem.id}>
                      {i > 0 && <Separator />}
                      <View style={styles.row}>
                        <View style={[styles.check, { backgroundColor: c.accentTint }]}>
                          <Ionicons name="checkmark" size={17} color={c.accent} />
                        </View>
                        <View style={styles.flex}>
                          <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>{m.wantedItem.title}</Text>
                          <Text numberOfLines={1} style={[styles.rowSub, { color: c.textTertiary }]}>
                            {TYPE_LABELS[m.wantedItem.type]}
                            {m.detectedTitle.toLowerCase() !== m.wantedItem.title.toLowerCase() ? ` · seen as “${m.detectedTitle}”` : ''}
                          </Text>
                        </View>
                        <Text style={[styles.score, { color: c.textSecondary }]}>{Math.round((1 - m.score) * 100)}%</Text>
                      </View>
                    </View>
                  ))}
                </Group>
              </View>
            )}

            {unmatched.length > 0 && (
              <View>
                <SectionHeader>{hit ? 'Also on the shelf' : 'On the shelf'}</SectionHeader>
                <Group>
                  {unmatched.map((title, i) => (
                    <View key={`${title}-${i}`}>
                      {i > 0 && <Separator />}
                      <View style={[styles.row, styles.rowCompact]}>
                        <Text numberOfLines={1} style={[styles.flex, styles.plain, { color: c.text }]}>{title}</Text>
                        <PillButton
                          label="Add"
                          doneLabel="Added"
                          done={wantedTitles.has(title.toLowerCase())}
                          onPress={() => onAddToWanted(title)}
                        />
                      </View>
                    </View>
                  ))}
                </Group>
              </View>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton label="Scan another shelf" onPress={onScanAgain} />
          </View>
        </>
      )}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  rowCompact: { paddingVertical: 8, paddingRight: 10 },
  check: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 1 },
  score: { fontSize: 13, fontWeight: '600' },
  plain: { fontSize: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
})
