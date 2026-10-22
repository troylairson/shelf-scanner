import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ScanRecord } from '../types'
import { useTheme } from '../theme'
import { formatDate, plural } from '../lib/format'
import { EmptyState, LargeTitle, Separator } from './ui'

interface Props {
  records: ScanRecord[]
  onOpen: (record: ScanRecord) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function HistoryScreen({ records, onOpen, onRemove, onClear }: Props) {
  const c = useTheme()

  function confirmClear() {
    Alert.alert('Clear history?', `This deletes all ${plural(records.length, 'scan')}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClear },
    ])
  }

  function confirmDelete(record: ScanRecord) {
    Alert.alert('Delete this scan?', formatDate(record.scannedAt), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onRemove(record.id) },
    ])
  }

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      data={records}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <LargeTitle
          title="History"
          subtitle={records.length ? `${plural(records.length, 'scan')} · press and hold to delete` : undefined}
          right={
            records.length > 0 ? (
              <Pressable onPress={confirmClear} hitSlop={10} accessibilityRole="button">
                <Text style={[styles.clear, { color: c.danger }]}>Clear</Text>
              </Pressable>
            ) : undefined
          }
        />
      }
      ListEmptyComponent={<EmptyState icon="time-outline" title="No scans yet" body="Your last 50 scans will show up here." />}
      renderItem={({ item: record, index }) => {
        const first = index === 0
        const last = index === records.length - 1
        const hits = record.matches.filter((m) => m.item.status === 'wanted').length
        return (
          <View style={[styles.itemWrap, { backgroundColor: c.card }, first && styles.top, last && styles.bottom]}>
            {!first && <Separator />}
            <Pressable
              onPress={() => onOpen(record)}
              onLongPress={() => confirmDelete(record)}
              accessibilityRole="button"
              accessibilityHint="Opens this scan. Press and hold to delete."
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.separator }]}
            >
              <View style={[styles.badge, { backgroundColor: hits ? c.accentTint : c.fill }]}>
                <Text style={[styles.badgeNum, { color: hits ? c.accent : c.textTertiary }]}>{hits}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: c.text }]}>
                  {hits ? plural(hits, 'match', 'matches') : 'No matches'} · {plural(record.detectedTitles.length, 'title')}
                </Text>
                <Text numberOfLines={1} style={[styles.preview, { color: c.textTertiary }]}>
                  {record.detectedTitles.slice(0, 3).join(', ')}
                  {record.detectedTitles.length > 3 ? ` +${record.detectedTitles.length - 3}` : ''}
                </Text>
                <Text style={[styles.date, { color: c.textSecondary }]}>{formatDate(record.scannedAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
            </Pressable>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  clear: { fontSize: 17, fontWeight: '500' },
  itemWrap: { marginHorizontal: 16, overflow: 'hidden' },
  top: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bottom: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  badge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontSize: 18, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600' },
  preview: { fontSize: 13, marginTop: 2 },
  date: { fontSize: 12, marginTop: 3 },
})
