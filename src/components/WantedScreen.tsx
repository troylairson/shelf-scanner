import { useState } from 'react'
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { WantedItem, MediaType } from '../types'
import { useTheme, PUNCH, DANGER } from '../theme'
import { EmptyState, HardButton, ScreenHeader, TypeChip, TypePicker } from './ui'

interface Props {
  items: WantedItem[]
  onAdd: (title: string, type: MediaType) => Promise<number>
  onRemove: (id: string) => void
  onImport: (titles: string[], type: MediaType) => Promise<number>
}

export function WantedScreen({ items, onAdd, onRemove, onImport }: Props) {
  const { colors } = useTheme()
  const [newTitle, setNewTitle] = useState('')
  const [type, setType] = useState<MediaType>('movie')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  const filtered = query ? items.filter((item) => item.title.toLowerCase().includes(query)) : items

  function flash(message: string) {
    setFeedback(message)
    setTimeout(() => setFeedback(null), 2500)
  }

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    const added = await onAdd(title, type)
    setNewTitle('')
    if (!added) flash('Already on your list')
  }

  async function handleImport() {
    const titles = importText.split('\n').map((t) => t.trim()).filter(Boolean)
    if (!titles.length) return
    const count = await onImport(titles, type)
    setImportText('')
    Keyboard.dismiss()
    flash(`+${count} added`)
  }

  const inputStyle = [styles.input, { borderColor: colors.fg, backgroundColor: colors.input, color: colors.fg, boxShadow: colors.shadowSm }]

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        title="Wanted"
        right={<Text style={[styles.count, { color: colors.muted(0.3) }]}>{items.length}</Text>}
      />

      <View style={[styles.form, { borderBottomColor: colors.muted(0.1) }]}>
        <View style={styles.addRow}>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleAdd}
            placeholder="Add a title..."
            placeholderTextColor={colors.muted(0.35)}
            returnKeyType="done"
            submitBehavior="submit"
            style={[inputStyle, { flex: 1 }]}
          />
          <HardButton label="Add" variant="punch" onPress={handleAdd} style={{ paddingVertical: 12, paddingHorizontal: 16 }} />
        </View>

        <TypePicker value={type} onChange={setType} />

        <View style={styles.toggleRow}>
          <Pressable onPress={() => setShowImport(!showImport)} style={styles.toggle} hitSlop={8}>
            <Ionicons name={showImport ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted(0.4)} />
            <Text style={[styles.toggleText, { color: colors.muted(0.4) }]}>Bulk Import</Text>
          </Pressable>
          {feedback && <Text style={[styles.feedback, { color: PUNCH }]}>{feedback}</Text>}
        </View>

        {showImport && (
          <View style={{ gap: 8 }}>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder={'One title per line\nThe Matrix\nAlien\nHalo 3'}
              placeholderTextColor={colors.muted(0.35)}
              multiline
              textAlignVertical="top"
              style={[inputStyle, { minHeight: 110, boxShadow: undefined }]}
            />
            <HardButton label={`Import as ${type === 'movie' ? 'film' : type}`} onPress={handleImport} style={{ paddingVertical: 10 }} />
          </View>
        )}

        {items.length > 5 && (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.muted(0.35)}
            clearButtonMode="while-editing"
            style={[styles.input, { borderColor: colors.muted(0.2), backgroundColor: colors.input, color: colors.fg }]}
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState label={items.length === 0 ? 'Nothing here yet' : 'No results'} />}
        renderItem={({ item }) => (
          <View style={[styles.item, { borderBottomColor: colors.muted(0.08) }]}>
            <TypeChip type={item.type} />
            <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.fg }]}>{item.title}</Text>
            <Pressable onPress={() => onRemove(item.id)} hitSlop={12} accessibilityLabel={`Remove ${item.title}`}>
              {({ pressed }) => <Ionicons name="close" size={18} color={pressed ? DANGER : colors.muted(0.3)} />}
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  count: { fontWeight: '900', fontSize: 14 },
  form: { paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 2 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toggleText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  feedback: { fontWeight: '900', fontSize: 13 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
})
