import type { AppView } from '../types'

interface Props {
  view: AppView
  onNavigate: (view: AppView) => void
  onThemeToggle: () => void
  theme: 'dark' | 'light'
}

const TABS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  {
    id: 'scanner',
    label: 'SCAN',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m9-16h3a1 1 0 011 1v3m0 9v3a1 1 0 01-1 1h-3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'wanted-list',
    label: 'WANTED',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14M5 9h14M5 13h8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 16l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'HISTORY',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export function BottomNav({ view, onNavigate, onThemeToggle, theme }: Props) {
  const activeId = view === 'results' ? 'scanner' : view

  return (
    <nav className="flex items-stretch border-t-2 border-ink dark:border-paper bg-paper dark:bg-ink">
      {TABS.map((tab) => {
        const active = activeId === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 border-r-2 border-ink dark:border-paper transition-colors ${
              active
                ? 'bg-punch text-ink'
                : 'text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/5'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-black tracking-widest">{tab.label}</span>
          </button>
        )
      })}

      <button
        onClick={onThemeToggle}
        className="px-4 flex flex-col items-center justify-center gap-1 text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/5 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
        <span className="text-[10px] font-black tracking-widest">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
      </button>
    </nav>
  )
}
