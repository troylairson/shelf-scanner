import { useState } from 'react'
import type { ScanRecord } from '../types'
import { ResultsView } from './ResultsView'

interface Props {
  records: ScanRecord[]
  onRemove: (id: string) => void
  onClear: () => void
  onAddToWanted: (title: string) => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isYesterday) return `Yesterday ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`
}

export function HistoryView({ records, onRemove, onClear, onAddToWanted }: Props) {
  const [viewing, setViewing] = useState<ScanRecord | null>(null)

  if (viewing) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b-2 border-ink dark:border-paper bg-paper dark:bg-ink">
          <button
            onClick={() => setViewing(null)}
            className="h-9 px-3 rounded-lg border-2 border-ink dark:border-paper font-black text-sm bg-paper dark:bg-ink text-ink dark:text-paper btn-hard-sm flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <p className="text-xs font-black uppercase tracking-widest text-ink/40 dark:text-paper/40">{formatDate(viewing.scannedAt)}</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ResultsView result={viewing} onScanAgain={() => setViewing(null)} onAddToWanted={onAddToWanted} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-ink">
      {/* Header */}
      <div className="px-6 pt-8 pb-5 border-b-2 border-ink dark:border-paper flex items-baseline justify-between">
        <h1 className="text-4xl font-black uppercase tracking-tight text-ink dark:text-paper">History</h1>
        <div className="flex items-center gap-3">
          <span className="text-ink/30 dark:text-paper/30 font-black text-sm">{records.length}</span>
          {records.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs font-black uppercase tracking-wide text-ink/30 dark:text-paper/30 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-ink/20 dark:text-paper/20 font-black text-5xl">∅</p>
            <p className="text-ink/30 dark:text-paper/30 font-bold text-sm uppercase tracking-wide">No scans yet</p>
          </div>
        ) : (
          records.map((record) => (
            <button
              key={record.id}
              onClick={() => setViewing(record)}
              className="w-full card-hard rounded-xl flex items-stretch text-left group overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform duration-75"
            >
              {/* Match count block */}
              <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center py-4 ${
                record.matches.length > 0 ? 'bg-punch' : 'bg-ink/5 dark:bg-paper/5'
              }`}>
                <span className={`text-2xl font-black leading-none ${
                  record.matches.length > 0 ? 'text-ink' : 'text-ink/20 dark:text-paper/20'
                }`}>
                  {record.matches.length}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                  record.matches.length > 0 ? 'text-ink/60' : 'text-ink/20 dark:text-paper/20'
                }`}>
                  {record.matches.length === 1 ? 'MATCH' : 'HITS'}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 px-4 py-3.5 border-l-2 border-ink dark:border-paper">
                <p className="text-ink dark:text-paper font-black text-sm">
                  {record.detectedTitles.length} title{record.detectedTitles.length !== 1 ? 's' : ''} detected
                </p>
                <p className="text-ink/40 dark:text-paper/40 text-xs mt-1 truncate">
                  {record.detectedTitles.slice(0, 3).join(' · ')}
                  {record.detectedTitles.length > 3 && ` +${record.detectedTitles.length - 3}`}
                </p>
                <p className="text-ink/20 dark:text-paper/20 text-xs font-bold mt-1.5 uppercase tracking-wide">{formatDate(record.scannedAt)}</p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(record.id) }}
                className="opacity-0 group-hover:opacity-100 px-3 border-l-2 border-ink dark:border-paper flex items-center text-ink/20 dark:text-paper/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
