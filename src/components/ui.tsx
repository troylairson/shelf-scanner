import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import type { MediaType } from '../types'

export const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Film',
  tv: 'TV',
  game: 'Game',
  other: 'Other',
}

export function LargeTitle({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  const c = useTheme()
  return (
    <View style={styles.largeTitle}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={[styles.titleText, { color: c.text }]}>{title}</Text>
        {right}
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  )
}

export function SectionHeader({ children }: { children: string }) {
  const c = useTheme()
  return <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>{children.toUpperCase()}</Text>
}

// Rounded white card holding a list of rows (iOS "inset grouped" list)
export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme()
  return <View style={[styles.group, { backgroundColor: c.card }, style]}>{children}</View>
}

export function Separator() {
  const c = useTheme()
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.separator, marginLeft: 16 }} />
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.primary, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={[styles.primaryText, { color: c.onPrimary }]}>{label}</Text>
    </Pressable>
  )
}

export function PillButton({ label, onPress, done, doneLabel }: { label: string; onPress: () => void; done?: boolean; doneLabel?: string }) {
  const c = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={done}
      accessibilityRole="button"
      accessibilityState={{ disabled: done }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: done ? 'transparent' : c.accentTint, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {done && <Ionicons name="checkmark" size={15} color={c.textTertiary} />}
      <Text style={[styles.pillText, { color: done ? c.textTertiary : c.accent }]}>{done ? doneLabel ?? label : label}</Text>
    </Pressable>
  )
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
}) {
  const c = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: active ? c.text : c.fill, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={active ? c.card : c.text} />
    </Pressable>
  )
}

// iOS-style segmented control
export function Segmented({ value, onChange }: { value: MediaType; onChange: (t: MediaType) => void }) {
  const c = useTheme()
  return (
    <View style={[styles.segment, { backgroundColor: c.fill }]} accessibilityRole="radiogroup">
      {(Object.keys(TYPE_LABELS) as MediaType[]).map((t) => {
        const active = t === value
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.segmentItem, active && { backgroundColor: c.card, boxShadow: '0px 1px 3px rgba(0,0,0,0.12)' }]}
          >
            <Text style={[styles.segmentText, { color: c.text, fontWeight: active ? '600' : '500' }]}>{TYPE_LABELS[t]}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function TypeTag({ type }: { type: MediaType }) {
  const c = useTheme()
  return <Text style={[styles.typeTag, { color: c.typeColors[type] }]}>{TYPE_LABELS[type]}</Text>
}

export function EmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body?: string }) {
  const c = useTheme()
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.fill }]}>
        <Ionicons name={icon} size={28} color={c.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {body ? <Text style={[styles.emptyBody, { color: c.textSecondary }]}>{body}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  largeTitle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleText: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  sectionHeader: { fontSize: 13, fontWeight: '600', letterSpacing: 0.6, paddingLeft: 4, paddingBottom: 8 },
  group: { borderRadius: 16, overflow: 'hidden' },
  primary: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 17, fontWeight: '600' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 14, borderRadius: 999 },
  pillText: { fontSize: 14, fontWeight: '600' },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 2 },
  segmentItem: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13 },
  typeTag: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
})
