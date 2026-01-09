import { useState, useEffect } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'

const Icons = {
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  minus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
}

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
      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-neutral-800 border border-neutral-700 rounded-xl p-3 shadow-xl z-50"
    >
      <div className="grid grid-cols-4 gap-2 w-max">
        {ALL_KEYS.map(key => (
          <button
            key={key}
            onClick={() => onSelectKey(key)}
            className={`w-10 h-10 rounded-lg text-sm font-mono transition-colors cursor-pointer flex items-center justify-center ${
              currentRoot === key
                ? 'bg-amber-600 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
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
}

export function FloatingControls({
  currentKey,
  onTransposeDown,
  onTransposeUp,
  onKeySelect,
  onFontDecrease,
  onFontIncrease,
  youtubeUrl,
}: FloatingControlsProps) {
  const [showKeySelector, setShowKeySelector] = useState(false)

  const handleKeySelect = (key: string) => {
    onKeySelect(key)
    setShowKeySelector(false)
  }

  return (
    <div className="z-40">
      <div className="flex flex-col gap-1 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
        {/* Transposicao */}
        <button
          onClick={onTransposeDown}
          title="Transpor -1 (-)"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {Icons.minus}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowKeySelector(!showKeySelector)}
            title="Selecionar tom"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-900/50 hover:bg-amber-900 text-amber-400 font-mono text-sm font-bold transition-colors cursor-pointer"
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

        <button
          onClick={onTransposeUp}
          title="Transpor +1 (+)"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {Icons.plus}
        </button>

        {/* Divisor */}
        <div className="w-full border-t border-neutral-700 my-1" />

        {/* Fonte */}
        <button
          onClick={onFontDecrease}
          title="Diminuir fonte (9)"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-xs font-bold">A-</span>
        </button>
        <button
          onClick={onFontIncrease}
          title="Aumentar fonte (0)"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-sm font-bold">A+</span>
        </button>

        {/* YouTube (se disponivel) */}
        {youtubeUrl && (
          <>
            <div className="w-full border-t border-neutral-700 my-1" />
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir no YouTube"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-red-500 hover:text-red-400 transition-colors"
            >
              {Icons.youtube}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
