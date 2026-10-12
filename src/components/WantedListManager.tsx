import { useState } from 'react'
import type { WantedItem, MediaType } from '../types'

interface Props {
  items: WantedItem[]
  onAdd: (title: string, type: MediaType) => void
  onRemove: (id: string) => void
  onImport: (titles: string[], type: MediaType) => Promise<number>
}

const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'FILM',
  tv: 'TV',
  game: 'GAME',
  other: 'OTHER',
}

const TYPE_CHIP: Record<MediaType, string> = {
  movie: 'bg-blue-500 text-white',
  tv: 'bg-purple-500 text-white',
  game: 'bg-orange-500 text-white',
  other: 'bg-ink dark:bg-paper text-paper dark:text-ink',
}

export function WantedListManager({ items, onAdd, onRemove, onImport }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<MediaType>('movie')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importType, setImportType] = useState<MediaType>('movie')
  const [importFeedback, setImportFeedback] = useState<string | null>(null)

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    onAdd(newTitle.trim(), newType)
    setNewTitle('')
  }

  async function handleBulkImport() {
    const titles = importText.split('\n').map((t) => t.trim()).filter(Boolean)
    if (!titles.length) return
    const count = await onImport(titles, importType)
    setImportFeedback(`+${count} added`)
    setImportText('')
    setTimeout(() => setImportFeedback(null), 3000)
  }

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-ink">
      {/* Header */}
      <div className="px-6 pt-8 pb-5 border-b-2 border-ink dark:border-paper">
        <div className="flex items-baseline justify-between">
          <h1 className="text-4xl font-black uppercase tracking-tight text-ink dark:text-paper">Wanted</h1>
          <span className="text-ink/30 dark:text-paper/30 font-black text-sm">{items.length}</span>
        </div>
      </div>

      {/* Add form */}
      <div className="px-4 pt-4 pb-2 border-b-2 border-ink/10 dark:border-paper/10">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a title..."
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold border-2 border-ink dark:border-paper bg-white dark:bg-zinc-900 focus:outline-none focus:ring-0 shadow-hard-sm dark:shadow-hard-sm-white"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as MediaType)}
            className="rounded-xl px-3 py-3 text-xs font-black border-2 border-ink dark:border-paper bg-white dark:bg-zinc-900 focus:outline-none cursor-pointer shadow-hard-sm dark:shadow-hard-sm-white"
          >
            {(Object.keys(TYPE_LABELS) as MediaType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-punch text-ink font-black rounded-xl px-4 py-3 text-sm uppercase tracking-wide btn-hard"
          >
            Add
          </button>
        </form>

        <button
          onClick={() => setShowImport(!showImport)}
          className="mt-3 flex items-center gap-1 text-ink/30 dark:text-paper/30 hover:text-ink/60 dark:hover:text-paper/60 text-xs font-black uppercase tracking-widest transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-3 h-3 transition-transform ${showImport ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          Bulk Import
        </button>

        {showImport && (
          <div className="mt-2 mb-1 space-y-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"One title per line\nThe Matrix\nAlien\nHalo 3"}
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 border-ink dark:border-paper bg-white dark:bg-zinc-900 focus:outline-none resize-none"
            />
            <div className="flex gap-2 items-center">
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as MediaType)}
                className="rounded-xl px-3 py-2 text-xs font-black border-2 border-ink dark:border-paper bg-white dark:bg-zinc-900 focus:outline-none"
              >
                {(Object.keys(TYPE_LABELS) as MediaType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <button
                onClick={handleBulkImport}
                className="flex-1 bg-ink dark:bg-paper text-paper dark:text-ink font-black rounded-xl py-2 text-sm uppercase tracking-wide btn-hard"
              >
                Import
              </button>
              {importFeedback && (
                <span className="text-punch font-black text-sm">{importFeedback}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {items.length > 5 && (
        <div className="px-4 py-3 border-b-2 border-ink/10 dark:border-paper/10">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border-2 border-ink/20 dark:border-paper/20 bg-white dark:bg-zinc-900 focus:outline-none focus:border-ink dark:focus:border-paper transition-colors"
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
            <p className="text-ink/20 dark:text-paper/20 font-black text-5xl">∅</p>
            <p className="text-ink/30 dark:text-paper/30 font-bold text-sm uppercase tracking-wide">
              {items.length === 0 ? 'Nothing here yet' : 'No results'}
            </p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-ink/5 dark:border-paper/5 group ${
                i === 0 ? 'border-t border-ink/5 dark:border-paper/5' : ''
              }`}
            >
              <span className={`text-[10px] px-2 py-0.5 rounded font-black border-2 border-ink dark:border-paper flex-shrink-0 ${TYPE_CHIP[item.type]}`}>
                {TYPE_LABELS[item.type]}
              </span>
              <p className="flex-1 text-ink dark:text-paper font-semibold text-sm truncate">{item.title}</p>
              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-ink/20 dark:text-paper/20 hover:text-red-500 font-black text-lg leading-none transition-all"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
