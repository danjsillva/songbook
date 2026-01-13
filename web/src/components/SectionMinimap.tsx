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

  // Keyboard navigation (Space/Shift+Space, no cycling)
  const navigatePrev = useCallback(() => {
    if (sections.length === 0 || currentSection <= 0) return
    onNavigate(sections[currentSection - 1].lineIndex)
  }, [sections, currentSection, onNavigate])

  const navigateNext = useCallback(() => {
    if (sections.length === 0 || currentSection >= sections.length - 1) return
    onNavigate(sections[currentSection + 1].lineIndex)
  }, [sections, currentSection, onNavigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === ' ') {
        e.preventDefault()
        if (e.shiftKey) {
          navigatePrev()
        } else {
          navigateNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigatePrev, navigateNext])

  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5 p-2 rounded-2xl glass border border-border">
      {sections.map((section, index) => {
        const isActive = currentSection === index
        const color = getSectionColor(section.section)

        return (
          <button
            key={`${section.section}-${section.lineIndex}`}
            onClick={() => onNavigate(section.lineIndex)}
            className="group relative flex items-center cursor-pointer transition-all duration-200"
            title={section.section}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-bg-primary'
                  : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
            <span className="absolute right-6 hidden group-hover:block text-xs font-medium text-text-primary bg-bg-elevated px-3 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-md border border-border animate-in">
              {section.section}
            </span>
          </button>
        )
      })}
    </div>
  )
}
