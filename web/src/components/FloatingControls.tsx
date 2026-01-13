import { useState, useEffect } from 'react'
import {
  Plus,
  Minus,
  Settings2,
  X,
} from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

interface KeySelectorProps {
  currentKey: string
  onSelectKey: (key: string) => void
  onClose: () => void
}

function KeySelector({ currentKey, onSelectKey, onClose }: KeySelectorProps) {
  const ref = useClickOutside<HTMLDivElement>(onClose)
  const currentRoot = currentKey.replace('m', '').replace('M', '')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border rounded-2xl p-4 shadow-xl z-50 animate-scale-in"
    >
      <div className="grid grid-cols-4 gap-2 w-max">
        {ALL_KEYS.map(key => (
          <button
            key={key}
            onClick={() => onSelectKey(key)}
            className={`w-11 h-11 rounded-xl text-sm font-mono font-medium transition-all duration-200 cursor-pointer flex items-center justify-center ${
              currentRoot === key
                ? 'bg-accent text-bg-primary shadow-glow'
                : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}

// YouTube Icon component
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

interface FloatingControlsProps {
  currentKey: string
  onTransposeDown: () => void
  onTransposeUp: () => void
  onKeySelect: (key: string) => void
  onFontDecrease: () => void
  onFontIncrease: () => void
  youtubeUrl?: string
  isMinimized?: boolean
  onToggleMinimized?: () => void
}

export function FloatingControls({
  currentKey,
  onTransposeDown,
  onTransposeUp,
  onKeySelect,
  onFontDecrease,
  onFontIncrease,
  youtubeUrl,
  isMinimized = false,
  onToggleMinimized,
}: FloatingControlsProps) {
  const [showKeySelector, setShowKeySelector] = useState(false)

  const handleKeySelect = (key: string) => {
    onKeySelect(key)
    setShowKeySelector(false)
  }

  const controlButton = (
    onClick: () => void,
    title: string,
    children: React.ReactNode,
    variant: 'default' | 'accent' | 'youtube' = 'default'
  ) => {
    const variantClasses = {
      default: 'bg-surface/80 hover:bg-surface text-text-secondary hover:text-text-primary',
      accent: 'bg-accent-subtle hover:bg-accent/20 text-accent',
      youtube: 'bg-danger-subtle hover:bg-danger-muted text-danger',
    }

    return (
      <button
        onClick={onClick}
        title={title}
        className={`w-11 h-11 flex items-center justify-center rounded-xl ${variantClasses[variant]} transition-all duration-200 cursor-pointer`}
      >
        {children}
      </button>
    )
  }

  // Mobile version with toggle
  if (onToggleMinimized) {
    return (
      <div className="z-40 relative">
        {/* Expanded panel - appears above the button */}
        {!isMinimized && (
          <div className="absolute bottom-full left-0 mb-3 flex flex-col gap-1.5 p-2 rounded-2xl glass border border-border shadow-lg animate-slide-up">
            {/* Transpose */}
            {controlButton(onTransposeDown, 'Transpor -1 (-)', <Minus className="w-4 h-4" />)}

            <div className="relative">
              <button
                onClick={() => setShowKeySelector(!showKeySelector)}
                title="Selecionar tom"
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-mono text-sm font-bold transition-all duration-200 cursor-pointer"
              >
                {currentKey}
              </button>
              {showKeySelector && (
                <KeySelector
                  currentKey={currentKey}
                  onSelectKey={handleKeySelect}
                  onClose={() => setShowKeySelector(false)}
                />
              )}
            </div>

            {controlButton(onTransposeUp, 'Transpor +1 (+)', <Plus className="w-4 h-4" />)}

            {/* Divider */}
            <div className="w-full h-px bg-border my-1" />

            {/* Font size */}
            {controlButton(onFontDecrease, 'Diminuir fonte (9)', <span className="text-xs font-bold">A-</span>)}
            {controlButton(onFontIncrease, 'Aumentar fonte (0)', <span className="text-sm font-bold">A+</span>)}

            {/* YouTube (if available) */}
            {youtubeUrl && (
              <>
                <div className="w-full h-px bg-border my-1" />
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir no YouTube"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-danger-subtle hover:bg-danger-muted text-danger transition-all duration-200"
                >
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              </>
            )}
          </div>
        )}

        {/* Toggle button - always visible */}
        <button
          onClick={onToggleMinimized}
          title={isMinimized ? "Expandir controles" : "Fechar controles"}
          className={`w-14 h-14 flex items-center justify-center rounded-2xl border border-border transition-all duration-200 cursor-pointer shadow-lg ${
            isMinimized
              ? 'glass text-text-secondary hover:text-text-primary'
              : 'bg-surface-active text-text-primary'
          }`}
        >
          {isMinimized ? <Settings2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>
    )
  }

  // Desktop version - always expanded
  return (
    <div className="z-40">
      <div className="flex flex-col gap-1.5 p-2 rounded-2xl glass border border-border shadow-lg">
        {/* Transpose */}
        {controlButton(onTransposeDown, 'Transpor -1 (-)', <Minus className="w-4 h-4" />)}

        <div className="relative">
          <button
            onClick={() => setShowKeySelector(!showKeySelector)}
            title="Selecionar tom"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-mono text-sm font-bold transition-all duration-200 cursor-pointer"
          >
            {currentKey}
          </button>
          {showKeySelector && (
            <KeySelector
              currentKey={currentKey}
              onSelectKey={handleKeySelect}
              onClose={() => setShowKeySelector(false)}
            />
          )}
        </div>

        {controlButton(onTransposeUp, 'Transpor +1 (+)', <Plus className="w-4 h-4" />)}

        {/* Divider */}
        <div className="w-full h-px bg-border my-1" />

        {/* Font size */}
        {controlButton(onFontDecrease, 'Diminuir fonte (9)', <span className="text-xs font-bold">A-</span>)}
        {controlButton(onFontIncrease, 'Aumentar fonte (0)', <span className="text-sm font-bold">A+</span>)}

        {/* YouTube (if available) */}
        {youtubeUrl && (
          <>
            <div className="w-full h-px bg-border my-1" />
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir no YouTube"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-danger-subtle hover:bg-danger-muted text-danger transition-all duration-200"
            >
              <YoutubeIcon className="w-5 h-5" />
            </a>
          </>
        )}
      </div>
    </div>
  )
}
