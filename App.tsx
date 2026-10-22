import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './src/theme'
import { ScannerScreen } from './src/components/ScannerScreen'
import { ResultsScreen } from './src/components/ResultsScreen'
import { CollectionScreen } from './src/components/CollectionScreen'
import { HistoryScreen } from './src/components/HistoryScreen'
import { BottomNav } from './src/components/BottomNav'
import { useCollection } from './src/hooks/useCollection'
import { useHistory } from './src/hooks/useHistory'
import { matchTitles } from './src/lib/titleMatcher'
import type { AppView, ItemStatus, MediaType, ScanRecord, ScanResult } from './src/types'

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
  const collection = useCollection()
  const { items, loading } = collection
  const history = useHistory()

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

  const addFor = useCallback(
    (status: ItemStatus) => (titles: string[], type: MediaType) => collection.addMany(titles, type, status),
    [collection.addMany]
  )

  const resultsProps = {
    byId: collection.byId,
    byTitle: collection.byTitle,
    onScanAgain: () => navigate('scanner'),
    onAdd: collection.addMany,
    onSetStatus: collection.setStatus,
  }

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
            {view === 'scanner' && (
              <ScannerScreen
                wantedCount={collection.wanted.length}
                ownedCount={collection.owned.length}
                onScanComplete={handleScanComplete}
              />
            )}
            {view === 'results' && scanResult && (
              <ResultsScreen {...resultsProps} result={scanResult} backLabel="Scan" onBack={() => navigate('scanner')} />
            )}
            {view === 'wanted-list' && (
              <CollectionScreen
                status="wanted"
                items={collection.wanted}
                onAdd={addFor('wanted')}
                onRemove={collection.remove}
                onMove={collection.setStatus}
              />
            )}
            {view === 'library' && (
              <CollectionScreen
                status="owned"
                items={collection.owned}
                onAdd={addFor('owned')}
                onRemove={collection.remove}
                onMove={collection.setStatus}
              />
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
                {...resultsProps}
                result={viewingRecord}
                backLabel="History"
                onBack={() => setViewingRecord(null)}
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
