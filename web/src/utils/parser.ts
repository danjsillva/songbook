import type { SongLine, ChordPosition } from '@songbook/shared'

// Regex para detectar acordes
const CHORD_REGEX = /^[A-G][#b]?(m|dim|aug|maj|sus|add)?\d*(\([^)]+\))?(\/[A-G][#b]?)?$/

function isChordToken(token: string): boolean {
  return CHORD_REGEX.test(token.trim())
}

function isChordLine(line: string): boolean {
  if (!line.trim()) return false

  const tokens = line.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false

  const chordCount = tokens.filter(isChordToken).length
  return chordCount / tokens.length >= 0.5
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractChordPositions(chordLine: string): ChordPosition[] {
  const positions: ChordPosition[] = []
  const regex = /(\S+)/g
  let match

  while ((match = regex.exec(chordLine)) !== null) {
    if (isChordToken(match[1])) {
      positions.push({
        chord: match[1],
        position: match.index
      })
    }
  }

  return positions
}

export function parseContent(html: string): SongLine[] {
  const text = stripHtml(html)
  const rawLines = text.split('\n')
  const result: SongLine[] = []

  let i = 0
  while (i < rawLines.length) {
    const currentLine = rawLines[i]
    const nextLine = rawLines[i + 1]

    if (!currentLine.trim()) {
      result.push({ lyrics: '', chords: [] })
      i++
      continue
    }

    if (isChordLine(currentLine)) {
      const chords = extractChordPositions(currentLine)

      if (nextLine && !isChordLine(nextLine)) {
        result.push({ lyrics: nextLine, chords })
        i += 2
      } else {
        result.push({ lyrics: '', chords })
        i++
      }
    } else {
      result.push({ lyrics: currentLine, chords: [] })
      i++
    }
  }

  return result
}
