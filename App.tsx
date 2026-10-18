import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme, PUNCH } from './src/theme'
import { ScannerScreen } from './src/components/ScannerScreen'
import { ResultsScreen } from './src/components/ResultsScreen'
import { WantedScreen } from './src/components/WantedScreen'
import { HistoryScreen, formatDate } from './src/components/HistoryScreen'
import { BottomNav } from './src/components/BottomNav'
import { useWantedList } from './src/hooks/useWantedList'
import { useHistory } from './src/hooks/useHistory'
import { matchTitles } from './src/lib/titleMatcher'
import type { AppView, ScanRecord, ScanResult } from './src/types'

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Main />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function Main() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [view, setView] = useState<AppView>('scanner')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [viewingRecord, setViewingRecord] = useState<ScanRecord | null>(null)
  const { items, loading, add, addMany, remove } = useWantedList()
  const history = useHistory()

  const wantedTitles = useMemo(() => new Set(items.map((i) => i.title.toLowerCase())), [items])

  const handleScanComplete = useCallback(
    async (detectedTitles: string[]) => {
      const { matches, unmatched } = matchTitles(detectedTitles, items)
      const result: ScanResult = { detectedTitles, matches, unmatched, scannedAt: Date.now() }
      setScanResult(result)
      setView('results')
      await history.save(result)
    },
    [items, history.save]
  )

  const navigate = useCallback((next: AppView) => {
    setScanResult(null)
    setViewingRecord(null)
    setView(next)
  }, [])

  const addToWanted = useCallback((title: string) => { add(title, 'other') }, [add])

  // Android hardware back: step out of sub-views before leaving the app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (viewingRecord) { setViewingRecord(null); return true }
      if (view !== 'scanner') { navigate('scanner'); return true }
      return false
    })
    return () => sub.remove()
  }, [view, viewingRecord, navigate])

  // Scanner is always dark (camera UI); other screens follow the theme
  const darkChrome = view === 'scanner' || colors.name === 'dark'
  const topColor = view === 'scanner' ? '#0a0a0a' : colors.bg

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={darkChrome ? 'light' : 'dark'} />
      <View style={{ height: insets.top, backgroundColor: topColor }} />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={PUNCH} />
          </View>
        ) : (
          <>
            {view === 'scanner' && <ScannerScreen onScanComplete={handleScanComplete} />}
            {view === 'results' && scanResult && (
              <ResultsScreen
                result={scanResult}
                wantedTitles={wantedTitles}
                onAction={() => navigate('scanner')}
                onAddToWanted={addToWanted}
              />
            )}
            {view === 'wanted-list' && (
              <WantedScreen items={items} onAdd={add} onRemove={remove} onImport={addMany} />
            )}
            {view === 'history' && !viewingRecord && (
              <HistoryScreen
                records={history.records}
                onOpen={setViewingRecord}
                onRemove={history.remove}
                onClear={history.clear}
              />
            )}
            {view === 'history' && viewingRecord && (
              <View style={styles.content}>
                <View style={[styles.subHeader, { borderBottomColor: colors.fg }]}>
                  <Text style={[styles.subHeaderText, { color: colors.muted(0.5) }]}>
                    {formatDate(viewingRecord.scannedAt)}
                  </Text>
                </View>
                <ResultsScreen
                  result={viewingRecord}
                  wantedTitles={wantedTitles}
                  actionLabel="Back to History"
                  onAction={() => setViewingRecord(null)}
                  onAddToWanted={addToWanted}
                />
              </View>
            )}
          </>
        )}
      </View>

      <BottomNav view={view} onNavigate={navigate} bottomInset={insets.bottom} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subHeader: { paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 2 },
  subHeaderText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
})
