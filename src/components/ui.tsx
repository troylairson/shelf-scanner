import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme, PUNCH, INK_COLOR, TYPE_COLORS } from '../theme'
import type { MediaType } from '../types'

type Variant = 'solid' | 'punch' | 'outline'

interface HardButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  small?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

// Neo-brutalist button: thick border + hard offset shadow that "presses in" on tap
export function HardButton({ label, onPress, variant = 'solid', small, disabled, style }: HardButtonProps) {
  const { colors } = useTheme()
  const bg = variant === 'punch' ? PUNCH : variant === 'solid' ? colors.fg : 'transparent'
  const fg = variant === 'punch' ? INK_COLOR : variant === 'solid' ? colors.bg : colors.fg

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small ? styles.buttonSmall : styles.buttonLarge,
        {
          backgroundColor: bg,
          borderColor: colors.fg,
          boxShadow: pressed ? undefined : small ? colors.shadowSm : colors.shadow,
          transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg, fontSize: small ? 12 : 17 }]}>{label}</Text>
    </Pressable>
  )
}

export const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'FILM',
  tv: 'TV',
  game: 'GAME',
  other: 'OTHER',
}

export function TypeChip({ type }: { type: MediaType }) {
  const { colors } = useTheme()
  const bg = type === 'other' ? colors.fg : TYPE_COLORS[type]
  const fg = type === 'other' ? colors.bg : '#ffffff'
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: colors.fg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{TYPE_LABELS[type]}</Text>
    </View>
  )
}

// Segmented control replacing the web <select>
export function TypePicker({ value, onChange }: { value: MediaType; onChange: (t: MediaType) => void }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.segment, { borderColor: colors.fg }]}>
      {(Object.keys(TYPE_LABELS) as MediaType[]).map((t, i) => {
        const active = t === value
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[
              styles.segmentItem,
              i > 0 && { borderLeftWidth: 2, borderLeftColor: colors.fg },
              active && { backgroundColor: PUNCH },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? INK_COLOR : colors.fg }]}>{TYPE_LABELS[t]}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.header, { borderBottomColor: colors.fg }]}>
      <Text style={[styles.headerTitle, { color: colors.fg }]}>{title}</Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  )
}

export function EmptyState({ label }: { label: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.empty}>
      <Text style={{ color: colors.muted(0.2), fontWeight: '900', fontSize: 48 }}>∅</Text>
      <Text style={[styles.emptyText, { color: colors.muted(0.3) }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  button: { borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonLarge: { paddingVertical: 16, paddingHorizontal: 24 },
  buttonSmall: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  buttonText: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: { borderWidth: 2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  chipText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  segment: { flexDirection: 'row', borderWidth: 2, borderRadius: 10, overflow: 'hidden' },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 36, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 64 },
  emptyText: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
})
