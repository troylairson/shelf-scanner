import { useState } from 'react'
import { Alert, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { CollectionItem, ItemStatus, MediaType } from '../types'
import { useTheme } from '../theme'
import { plural } from '../lib/format'
import { countByType } from '../lib/collection'
import { EmptyState, Group, LargeTitle, PrimaryButton, SectionHeader, Segmented, Separator, TypeTag } from './ui'

interface Props {
  status: ItemStatus
  /** Items with this status only */
  items: CollectionItem[]
  /** Adds titles with this screen's status (or moves them here); returns how many changed */
  onAdd: (titles: string[], type: MediaType) => Promise<number>
  onRemove: (id: string) => void
  onMove: (id: string, status: ItemStatus) => void
}

const COPY = {
  wanted: {
    title: 'Wanted',
    other: 'Library',
    placeholder: 'Add a title you want',
    emptyIcon: 'list-outline',
    emptyTitle: 'Nothing on your list yet',
    emptyBody: "Add the films, shows and games you're hunting for. Scans will flag them.",
  },
  owned: {
    title: 'Library',
    other: 'Wanted',
    placeholder: 'Add a title you own',
    emptyIcon: 'library-outline',
    emptyTitle: 'Your Library is empty',
    emptyBody: 'Scan your own shelves and tap “Add all to Library”, or add titles here. Scans will tell you what you already own.',
  },
} as const

const TYPE_PLURALS: Record<MediaType, [string, string]> = {
  movie: ['film', 'films'],
  tv: ['TV show', 'TV shows'],
  game: ['game', 'games'],
  other: ['other', 'other'],
}

function librarySummary(items: CollectionItem[]): string {
  if (!items.length) return '0 titles'
  const counts = countByType(items)
  return (Object.keys(counts) as MediaType[])
    .filter((t) => counts[t] > 0)
    .map((t) => plural(counts[t], TYPE_PLURALS[t][0], TYPE_PLURALS[t][1]))
    .join(' · ')
}

export function CollectionScreen({ status, items, onAdd, onRemove, onMove }: Props) {
  const c = useTheme()
  const copy = COPY[status]
  const [newTitle, setNewTitle] = useState('')
  const [type, setType] = useState<MediaType>('movie')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  // Newest first, like a native list
  const sorted = [...items].sort((a, b) => b.addedAt - a.addedAt)
  const filtered = query ? sorted.filter((item) => item.title.toLowerCase().includes(query)) : sorted

  function flash(message: string) {
    setFeedback(message)
    setTimeout(() => setFeedback(null), 2500)
  }

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    const added = await onAdd([title], type)
    setNewTitle('')
    flash(added ? `Added “${title}”` : 'Already here')
  }

  async function handleImport() {
    const titles = importText.split('\n').map((t) => t.trim()).filter(Boolean)
    if (!titles.length) return
    const count = await onAdd(titles, type)
    setImportText('')
    setShowImport(false)
    Keyboard.dismiss()
    flash(`Imported ${plural(count, 'title')}`)
  }

  function showActions(item: CollectionItem) {
    Alert.alert(item.title, undefined, [
      { text: `Move to ${copy.other}`, onPress: () => onMove(item.id, status === 'wanted' ? 'owned' : 'wanted') },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const header = (
    <View style={styles.headerWrap}>
      <LargeTitle
        title={copy.title}
        subtitle={status === 'owned' ? librarySummary(items) : plural(items.length, 'title')}
      />

      <View style={styles.section}>
        <Group>
          <View style={styles.addRow}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={handleAdd}
              placeholder={copy.placeholder}
              placeholderTextColor={c.textTertiary}
              returnKeyType="done"
              submitBehavior="submit"
              accessibilityLabel="Title to add"
              style={[styles.addInput, { color: c.text }]}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!newTitle.trim()}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: c.accentFill, opacity: !newTitle.trim() ? 0.4 : pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          <Separator />
          <View style={styles.segmentWrap}>
            <Segmented value={type} onChange={setType} />
          </View>
        </Group>

        <View style={styles.metaRow}>
          <Pressable onPress={() => setShowImport((s) => !s)} hitSlop={8} accessibilityRole="button" style={styles.importToggle}>
            <Ionicons name={showImport ? 'chevron-up' : 'document-text-outline'} size={16} color={c.accent} />
            <Text style={[styles.importToggleText, { color: c.accent }]}>{showImport ? 'Hide import' : 'Import a list'}</Text>
          </Pressable>
          {feedback && <Text style={[styles.feedback, { color: c.textSecondary }]}>{feedback}</Text>}
        </View>

        {showImport && (
          <View style={styles.importBox}>
            <Group>
              <TextInput
                value={importText}
                onChangeText={setImportText}
                placeholder={'One title per line\nThe Matrix\nAlien\nHalo 3'}
                placeholderTextColor={c.textTertiary}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Titles to import, one per line"
                style={[styles.importInput, { color: c.text }]}
              />
            </Group>
            <PrimaryButton label="Import" onPress={handleImport} />
          </View>
        )}
      </View>

      {items.length > 5 && (
        <View style={[styles.search, { backgroundColor: c.fill }]}>
          <Ionicons name="search" size={17} color={c.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={c.textTertiary}
            clearButtonMode="while-editing"
            accessibilityLabel={`Search ${copy.title}`}
            style={[styles.searchInput, { color: c.text }]}
          />
        </View>
      )}

      {filtered.length > 0 && (
        <View style={styles.listHeader}>
          <SectionHeader>{query ? 'Results' : status === 'owned' ? 'In your Library' : 'Your list'}</SectionHeader>
        </View>
      )}
    </View>
  )

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      data={filtered}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={header}
      ListFooterComponent={
        filtered.length > 0 ? (
          <Text style={[styles.footerHint, { color: c.textTertiary }]}>
            Press and hold a title to move it to {copy.other} or remove it.
          </Text>
        ) : null
      }
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        items.length === 0 ? (
          <EmptyState icon={copy.emptyIcon} title={copy.emptyTitle} body={copy.emptyBody} />
        ) : (
          <EmptyState icon="search-outline" title="No results" body={`Nothing matches “${search.trim()}”.`} />
        )
      }
      renderItem={({ item, index }) => {
        const first = index === 0
        const last = index === filtered.length - 1
        return (
          <View
            style={[
              styles.itemWrap,
              { backgroundColor: c.card },
              first && styles.top,
              last && styles.bottom,
            ]}
          >
            {!first && <Separator />}
            <Pressable
              onLongPress={() => showActions(item)}
              accessibilityHint={`Press and hold to move to ${copy.other} or remove`}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: c.separator }]}
            >
              <View style={styles.flex}>
                <Text numberOfLines={1} style={[styles.itemTitle, { color: c.text }]}>{item.title}</Text>
                <TypeTag type={item.type} />
              </View>
              <Pressable onPress={() => onRemove(item.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Remove ${item.title}`}>
                {({ pressed }) => <Ionicons name="close" size={20} color={pressed ? c.danger : c.textTertiary} />}
              </Pressable>
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
  headerWrap: { gap: 0 },
  section: { paddingHorizontal: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 8, gap: 8 },
  addInput: { flex: 1, fontSize: 16, minHeight: 40 },
  addButton: { height: 36, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center' },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  segmentWrap: { padding: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 12 },
  importToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  importToggleText: { fontSize: 15, fontWeight: '500' },
  feedback: { fontSize: 14, flexShrink: 1, textAlign: 'right' },
  importBox: { gap: 10, paddingTop: 8 },
  importInput: { minHeight: 120, fontSize: 16, padding: 16 },
  search: { marginHorizontal: 16, marginTop: 18, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  listHeader: { paddingHorizontal: 16, paddingTop: 22 },
  itemWrap: { marginHorizontal: 16 },
  top: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bottom: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  itemTitle: { fontSize: 16, marginBottom: 2 },
  footerHint: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32, paddingTop: 12 },
})
