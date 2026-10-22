import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { AppView } from '../types'
import { useTheme } from '../theme'

type Tab = Exclude<AppView, 'results'>
type Icon = keyof typeof Ionicons.glyphMap

const TABS: { id: Tab; label: string; icon: Icon; activeIcon: Icon }[] = [
  { id: 'scanner', label: 'Scan', icon: 'scan-outline', activeIcon: 'scan' },
  { id: 'wanted-list', label: 'Wanted', icon: 'list-outline', activeIcon: 'list' },
  { id: 'library', label: 'Library', icon: 'library-outline', activeIcon: 'library' },
  { id: 'history', label: 'History', icon: 'time-outline', activeIcon: 'time' },
]

interface Props {
  view: AppView
  onNavigate: (view: Tab) => void
  bottomInset: number
}

export function BottomNav({ view, onNavigate, bottomInset }: Props) {
  const c = useTheme()
  const activeId = view === 'results' ? 'scanner' : view

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.nav, { backgroundColor: c.card, borderTopColor: c.hairline, paddingBottom: Math.max(bottomInset, 8) }]}
    >
      {TABS.map((tab) => {
        const active = activeId === tab.id
        const color = active ? c.accent : c.textTertiary
        return (
          <Pressable
            key={tab.id}
            onPress={() => onNavigate(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color, fontWeight: active ? '600' : '500' }]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, minHeight: 44 },
  label: { fontSize: 11 },
})
