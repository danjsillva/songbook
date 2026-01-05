import { useMemo, useEffect, useCallback } from 'react'
import type { SongLine } from '@songbook/shared'
import { getSectionColor } from '@songbook/shared'

interface SectionInfo {
  section: string
  lineIndex: number
}

interface SectionMinimapProps {
  content: SongLine[]
  currentSection: number
  onNavigate: (lineIndex: number) => void
}

export function SectionMinimap({ content, currentSection, onNavigate }: SectionMinimapProps) {
  const sections = useMemo(() => {
    const result: SectionInfo[] = []

    content.forEach((line, index) => {
      if (line.section) {
        result.push({
          section: line.section,
          lineIndex: index,
        })
      }
    })

    return result
  }, [content])

  // Navegação por teclado (setas cima/baixo)
  const navigatePrev = useCallback(() => {
    if (sections.length === 0) return
    const prevIndex = currentSection > 0 ? currentSection - 1 : sections.length - 1
    onNavigate(sections[prevIndex].lineIndex)
  }, [sections, currentSection, onNavigate])

  const navigateNext = useCallback(() => {
    if (sections.length === 0) return
    const nextIndex = currentSection < sections.length - 1 ? currentSection + 1 : 0
    onNavigate(sections[nextIndex].lineIndex)
  }, [sections, currentSection, onNavigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        navigatePrev()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        navigateNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigatePrev, navigateNext])

  if (sections.length === 0) return null

  return (
    <div className="fixed left-20 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40 py-8">
      {sections.map((section, index) => {
        const isActive = currentSection === index
        const color = getSectionColor(section.section)

        return (
          <button
            key={`${section.section}-${section.lineIndex}`}
            onClick={() => onNavigate(section.lineIndex)}
            className={`group relative flex items-center cursor-pointer transition-all ${
              isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
            }`}
            title={section.section}
          >
            <span
              className={`w-4 h-4 rounded-full ${
                isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
              }`}
              style={{ backgroundColor: color }}
            />
            <span className="absolute left-6 hidden group-hover:block text-xs font-medium text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded whitespace-nowrap">
              {section.section}
            </span>
          </button>
        )
      })}
    </div>
  )
}
