import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './src/theme'
import { ScannerScreen } from './src/components/ScannerScreen'
import { ResultsScreen } from './src/components/ResultsScreen'
import { WantedScreen } from './src/components/WantedScreen'
import { HistoryScreen } from './src/components/HistoryScreen'
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
  const c = useTheme()
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

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar style={c.name === 'dark' ? 'light' : 'dark'} />
      <View style={{ height: insets.top }} />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : (
          <>
            {view === 'scanner' && <ScannerScreen wantedCount={items.length} onScanComplete={handleScanComplete} />}
            {view === 'results' && scanResult && (
              <ResultsScreen
                result={scanResult}
                wantedTitles={wantedTitles}
                backLabel="Scan"
                onBack={() => navigate('scanner')}
                onScanAgain={() => navigate('scanner')}
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
              <ResultsScreen
                result={viewingRecord}
                wantedTitles={wantedTitles}
                backLabel="History"
                onBack={() => setViewingRecord(null)}
                onScanAgain={() => navigate('scanner')}
                onAddToWanted={addToWanted}
              />
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
})
