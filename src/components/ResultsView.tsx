import type { ScanResult } from '../types'

interface Props {
  result: ScanResult
  onScanAgain: () => void
  onAddToWanted: (title: string) => void
}

export function ResultsView({ result, onScanAgain, onAddToWanted }: Props) {
  const { matches, unmatched, detectedTitles } = result
  const hasMatches = matches.length > 0

  if (detectedTitles.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-8 bg-paper dark:bg-ink">
        <p className="text-7xl font-black text-ink dark:text-paper leading-none">0</p>
        <div className="text-center">
          <p className="text-ink dark:text-paper font-black text-2xl uppercase tracking-tight">No Titles Found</p>
          <p className="text-ink/40 dark:text-paper/40 text-sm mt-2">Try a clearer photo, or check the terminal for API errors</p>
        </div>
        <button onClick={onScanAgain} className="mt-2 px-8 py-4 bg-ink dark:bg-paper text-paper dark:text-ink font-black text-lg uppercase tracking-wide btn-hard rounded-xl">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-ink overflow-hidden">
      {/* Header */}
      <div className={`px-6 pt-8 pb-6 border-b-2 border-ink dark:border-paper ${hasMatches ? 'bg-punch' : 'bg-paper dark:bg-ink'}`}>
        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${hasMatches ? 'text-ink/60' : 'text-ink/40 dark:text-paper/40'}`}>
          Scan Results
        </p>
        <div className="flex items-baseline gap-3">
          <span className={`text-7xl font-black leading-none ${hasMatches ? 'text-ink' : 'text-ink/20 dark:text-paper/20'}`}>
            {matches.length}
          </span>
          <span className={`text-2xl font-black uppercase tracking-tight ${hasMatches ? 'text-ink' : 'text-ink/40 dark:text-paper/40'}`}>
            {matches.length === 1 ? 'Match' : 'Matches'}
          </span>
        </div>
        <p className={`text-sm font-bold mt-1 ${hasMatches ? 'text-ink/60' : 'text-ink/30 dark:text-paper/30'}`}>
          {detectedTitles.length} title{detectedTitles.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {matches.map((match) => (
          <div key={match.wantedItem.id} className="card-hard rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-punch border-2 border-ink flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4 text-ink">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ink dark:text-paper font-black truncate">{match.wantedItem.title}</p>
              {match.detectedTitle.toLowerCase() !== match.wantedItem.title.toLowerCase() && (
                <p className="text-ink/40 dark:text-paper/40 text-xs mt-0.5 truncate">"{match.detectedTitle}"</p>
              )}
            </div>
            <span className="text-ink/40 dark:text-paper/40 text-xs font-black flex-shrink-0">
              {Math.round((1 - match.score) * 100)}%
            </span>
          </div>
        ))}

        {unmatched.length > 0 && (
          <>
            {hasMatches && (
              <p className="text-ink/50 dark:text-paper/50 text-xs font-black uppercase tracking-widest px-1 pt-2">
                Not on your list
              </p>
            )}
            {unmatched.map((title, i) => (
              <div key={i} className="border-2 border-ink/10 dark:border-paper/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-ink/40 dark:bg-paper/40 flex-shrink-0" />
                <p className="text-ink/80 dark:text-paper/80 flex-1 min-w-0 truncate text-sm font-semibold">{title}</p>
                <button
                  onClick={() => onAddToWanted(title)}
                  className="text-xs text-ink dark:text-paper font-black border-2 border-ink dark:border-paper px-2.5 py-1 rounded-lg btn-hard-sm flex-shrink-0"
                >
                  + WANT
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Action */}
      <div className="px-5 py-5 border-t-2 border-ink dark:border-paper bg-paper dark:bg-ink">
        <button
          onClick={onScanAgain}
          className="w-full py-4 bg-ink dark:bg-paper text-paper dark:text-ink font-black text-lg uppercase tracking-wide btn-hard rounded-xl"
        >
          Scan Again
        </button>
      </div>
    </div>
  )
}
