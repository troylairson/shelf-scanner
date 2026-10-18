import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ScanResult } from '../types'
import { useTheme, PUNCH, INK_COLOR } from '../theme'
import { HardButton } from './ui'

interface Props {
  result: ScanResult
  wantedTitles: Set<string>
  actionLabel?: string
  onAction: () => void
  onAddToWanted: (title: string) => void
}

export function ResultsScreen({ result, wantedTitles, actionLabel = 'Scan Again', onAction, onAddToWanted }: Props) {
  const { colors } = useTheme()
  const { matches, unmatched, detectedTitles } = result
  const hasMatches = matches.length > 0

  if (detectedTitles.length === 0) {
    return (
      <View style={[styles.emptyRoot, { backgroundColor: colors.bg }]}>
        <Text style={[styles.bigNumber, { color: colors.fg }]}>0</Text>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.emptyTitle, { color: colors.fg }]}>No Titles Found</Text>
          <Text style={[styles.emptyHint, { color: colors.muted(0.4) }]}>
            Try a closer, well-lit photo with the spines facing the camera
          </Text>
        </View>
        <HardButton label="Try Again" onPress={onAction} />
      </View>
    )
  }

  const headFg = hasMatches ? INK_COLOR : colors.fg
  const headMuted = (a: number) => (hasMatches ? `rgba(10,10,10,${a})` : colors.muted(a))

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.fg, backgroundColor: hasMatches ? PUNCH : colors.bg }]}>
        <Text style={[styles.eyebrow, { color: headMuted(hasMatches ? 0.6 : 0.4) }]}>Scan Results</Text>
        <View style={styles.countRow}>
          <Text style={[styles.bigNumber, { color: hasMatches ? headFg : colors.muted(0.2) }]}>{matches.length}</Text>
          <Text style={[styles.countLabel, { color: hasMatches ? headFg : colors.muted(0.4) }]}>
            {matches.length === 1 ? 'Match' : 'Matches'}
          </Text>
        </View>
        <Text style={[styles.detected, { color: headMuted(hasMatches ? 0.6 : 0.3) }]}>
          {detectedTitles.length} title{detectedTitles.length !== 1 ? 's' : ''} detected
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {matches.map((match) => (
          <View
            key={match.wantedItem.id}
            style={[styles.card, { borderColor: colors.fg, backgroundColor: colors.card, boxShadow: colors.shadow }]}
          >
            <View style={[styles.check, { borderColor: INK_COLOR }]}>
              <Ionicons name="checkmark" size={16} color={INK_COLOR} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.matchTitle, { color: colors.fg }]}>{match.wantedItem.title}</Text>
              {match.detectedTitle.toLowerCase() !== match.wantedItem.title.toLowerCase() && (
                <Text numberOfLines={1} style={[styles.small, { color: colors.muted(0.4) }]}>"{match.detectedTitle}"</Text>
              )}
            </View>
            <Text style={[styles.score, { color: colors.muted(0.4) }]}>{Math.round((1 - match.score) * 100)}%</Text>
          </View>
        ))}

        {unmatched.length > 0 && hasMatches && (
          <Text style={[styles.section, { color: colors.muted(0.5) }]}>Not on your list</Text>
        )}
        {unmatched.map((title, i) => {
          const added = wantedTitles.has(title.toLowerCase())
          return (
            <View key={`${title}-${i}`} style={[styles.row, { borderColor: colors.muted(0.1) }]}>
              <View style={[styles.dot, { backgroundColor: colors.muted(0.4) }]} />
              <Text numberOfLines={1} style={[styles.unmatched, { color: colors.muted(0.8) }]}>{title}</Text>
              <HardButton
                small
                variant={added ? 'punch' : 'outline'}
                label={added ? '✓ Wanted' : '+ Want'}
                disabled={added}
                onPress={() => onAddToWanted(title)}
              />
            </View>
          )
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.fg }]}>
        <HardButton label={actionLabel} onPress={onAction} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 },
  emptyTitle: { fontWeight: '900', fontSize: 24, textTransform: 'uppercase' },
  emptyHint: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22, borderBottomWidth: 2 },
  eyebrow: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  bigNumber: { fontSize: 72, fontWeight: '900', lineHeight: 76 },
  countLabel: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
  detected: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, backgroundColor: PUNCH, alignItems: 'center', justifyContent: 'center' },
  matchTitle: { fontWeight: '900', fontSize: 16 },
  small: { fontSize: 12, marginTop: 2 },
  score: { fontSize: 12, fontWeight: '900' },
  section: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, paddingHorizontal: 4, paddingTop: 8 },
  row: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  unmatched: { flex: 1, fontSize: 14, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 2 },
})
