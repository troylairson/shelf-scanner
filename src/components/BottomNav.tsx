import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { AppView } from '../types'
import { useTheme, PUNCH, INK_COLOR } from '../theme'

type Tab = Exclude<AppView, 'results'>

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'scanner', label: 'SCAN', icon: 'scan' },
  { id: 'wanted-list', label: 'WANTED', icon: 'list' },
  { id: 'history', label: 'HISTORY', icon: 'time-outline' },
]

interface Props {
  view: AppView
  onNavigate: (view: Tab) => void
  bottomInset: number
}

export function BottomNav({ view, onNavigate, bottomInset }: Props) {
  const { colors, toggle } = useTheme()
  const activeId = view === 'results' ? 'scanner' : view
  const dark = colors.name === 'dark'

  return (
    <View style={[styles.nav, { borderTopColor: colors.fg, backgroundColor: colors.bg, paddingBottom: bottomInset }]}>
      {TABS.map((tab) => {
        const active = activeId === tab.id
        const fg = active ? INK_COLOR : colors.fg
        return (
          <Pressable
            key={tab.id}
            onPress={() => onNavigate(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, { borderRightColor: colors.fg }, active && { backgroundColor: PUNCH }]}
          >
            <Ionicons name={tab.icon} size={20} color={fg} />
            <Text style={[styles.label, { color: fg }]}>{tab.label}</Text>
          </Pressable>
        )
      })}
      <Pressable onPress={toggle} style={styles.theme} accessibilityLabel="Toggle theme">
        <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.fg} />
        <Text style={[styles.label, { color: colors.fg }]}>{dark ? 'LIGHT' : 'DARK'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', borderTopWidth: 2 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4, borderRightWidth: 2 },
  theme: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
})
