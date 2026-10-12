import { useState, useCallback } from 'react'
import { CameraView } from './components/CameraView'
import { ResultsView } from './components/ResultsView'
import { WantedListManager } from './components/WantedListManager'
import { HistoryView } from './components/HistoryView'
import { BottomNav } from './components/BottomNav'
import { useWantedList } from './hooks/useWantedList'
import { useHistory } from './hooks/useHistory'
import { useTheme } from './hooks/useTheme'
import { matchTitles } from './utils/titleMatcher'
import type { AppView, ScanResult, MediaType } from './types'

export default function App() {
  const [view, setView] = useState<AppView>('scanner')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const { items, loading, add, remove, importTitles } = useWantedList()
  const { records, save: saveRecord, remove: removeRecord, clear: clearHistory } = useHistory()
  const { theme, toggle } = useTheme()

  const handleScanComplete = useCallback(
    async (_raw: ScanResult, detectedTitles: string[]) => {
      const { matches, unmatched } = matchTitles(detectedTitles, items)
      const result: ScanResult = { detectedTitles, matches, unmatched, scannedAt: Date.now() }
      setScanResult(result)
      setView('results')
      await saveRecord(result)
    },
    [items, saveRecord]
  )

  const handleScanAgain = useCallback(() => {
    setScanResult(null)
    setView('scanner')
  }, [])

  const handleNavigate = useCallback((next: AppView) => {
    if (next !== 'results') setScanResult(null)
    setView(next)
  }, [])

  const handleAddToWanted = useCallback(
    (title: string) => add(title, 'other'),
    [add]
  )

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      <div className="flex-1 overflow-hidden">
        {view === 'scanner' && (
          <CameraView onScanComplete={handleScanComplete} />
        )}
        {view === 'results' && scanResult && (
          <ResultsView
            result={scanResult}
            onScanAgain={handleScanAgain}
            onAddToWanted={handleAddToWanted}
          />
        )}
        {view === 'wanted-list' && (
          <WantedListManager
            items={items}
            onAdd={(title: string, type: MediaType) => { add(title, type) }}
            onRemove={remove}
            onImport={importTitles}
          />
        )}
        {view === 'history' && (
          <HistoryView
            records={records}
            onRemove={removeRecord}
            onClear={clearHistory}
            onAddToWanted={handleAddToWanted}
          />
        )}
      </div>
      <BottomNav
        view={view}
        onNavigate={handleNavigate}
        onThemeToggle={toggle}
        theme={theme}
      />
    </div>
  )
}
