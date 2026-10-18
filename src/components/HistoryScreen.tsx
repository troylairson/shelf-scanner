import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ScanRecord } from '../types'
import { useTheme, PUNCH, INK_COLOR, DANGER } from '../theme'
import { EmptyState, ScreenHeader } from './ui'

interface Props {
  records: ScanRecord[]
  onOpen: (record: ScanRecord) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isYesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

export function HistoryScreen({ records, onOpen, onRemove, onClear }: Props) {
  const { colors } = useTheme()

  function confirmClear() {
    Alert.alert('Clear history?', `Delete all ${records.length} scans.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClear },
    ])
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        title="History"
        right={
          <>
            <Text style={[styles.meta, { color: colors.muted(0.3) }]}>{records.length}</Text>
            {records.length > 0 && (
              <Pressable onPress={confirmClear} hitSlop={8}>
                <Text style={[styles.meta, styles.clear, { color: colors.muted(0.4) }]}>Clear</Text>
              </Pressable>
            )}
          </>
        }
      />

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState label="No scans yet" />}
        renderItem={({ item: record }) => {
          const hit = record.matches.length > 0
          return (
            <Pressable
              onPress={() => onOpen(record)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: colors.fg,
                  backgroundColor: colors.card,
                  boxShadow: pressed ? undefined : colors.shadow,
                  transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
                },
              ]}
            >
              <View style={[styles.countBlock, { backgroundColor: hit ? PUNCH : colors.muted(0.05) }]}>
                <Text style={[styles.countNum, { color: hit ? INK_COLOR : colors.muted(0.2) }]}>{record.matches.length}</Text>
                <Text style={[styles.countLabel, { color: hit ? 'rgba(10,10,10,0.6)' : colors.muted(0.2) }]}>
                  {record.matches.length === 1 ? 'MATCH' : 'HITS'}
                </Text>
              </View>

              <View style={[styles.info, { borderLeftColor: colors.fg }]}>
                <Text style={[styles.infoTitle, { color: colors.fg }]}>
                  {record.detectedTitles.length} title{record.detectedTitles.length !== 1 ? 's' : ''} detected
                </Text>
                <Text numberOfLines={1} style={[styles.preview, { color: colors.muted(0.4) }]}>
                  {record.detectedTitles.slice(0, 3).join(' · ')}
                  {record.detectedTitles.length > 3 ? ` +${record.detectedTitles.length - 3}` : ''}
                </Text>
                <Text style={[styles.date, { color: colors.muted(0.3) }]}>{formatDate(record.scannedAt)}</Text>
              </View>

              <Pressable
                onPress={() => onRemove(record.id)}
                hitSlop={8}
                style={[styles.delete, { borderLeftColor: colors.fg }]}
                accessibilityLabel="Delete scan"
              >
                {({ pressed }) => <Ionicons name="close" size={18} color={pressed ? DANGER : colors.muted(0.3)} />}
              </Pressable>
            </Pressable>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  meta: { fontWeight: '900', fontSize: 14 },
  clear: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 2, borderRadius: 12, flexDirection: 'row', overflow: 'hidden' },
  countBlock: { width: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  countNum: { fontSize: 24, fontWeight: '900' },
  countLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  info: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 2 },
  infoTitle: { fontWeight: '900', fontSize: 14 },
  preview: { fontSize: 12, marginTop: 4 },
  date: { fontSize: 11, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  delete: { paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 2 },
})
