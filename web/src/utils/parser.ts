import type { SongLine, ChordPosition } from '@songbook/shared'

// Regex para detectar acordes
const CHORD_REGEX = /^[A-G][#b]?(m|dim|aug|maj|sus|add)?\d*(\([^)]+\))?(\/[A-G][#b]?)?$/

// Detecta se uma linha é um marcador de seção [qualquer texto]
function parseSectionMarker(line: string): string | null {
  const trimmed = line.trim()
  // Aceita marcadores entre colchetes [Texto] ou parênteses (Texto)
  const match = trimmed.match(/^[\[\(]([^\]\)]+)[\]\)]$/)
  if (!match) return null

  return match[1].trim()
}

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

  let currentSection: string | undefined = undefined
  let i = 0

  // Encontra a próxima linha não-vazia que não seja marcador de seção
  function findNextLyricLine(startIndex: number): { line: string; index: number } | null {
    for (let j = startIndex; j < rawLines.length; j++) {
      const line = rawLines[j]
      if (line.trim() && !isChordLine(line) && !parseSectionMarker(line)) {
        return { line, index: j }
      }
      // Para se encontrar outra linha de acordes ou marcador antes de letra
      if (line.trim() && (isChordLine(line) || parseSectionMarker(line))) {
        return null
      }
    }
    return null
  }

  while (i < rawLines.length) {
    const currentLine = rawLines[i]

    if (!currentLine.trim()) {
      // Linha vazia - pula sem adicionar ao resultado
      i++
      continue
    }

    // Verifica se é um marcador de seção
    const sectionType = parseSectionMarker(currentLine)
    if (sectionType) {
      currentSection = sectionType
      // Não adiciona a linha do marcador ao resultado, apenas marca a próxima linha
      i++
      continue
    }

    if (isChordLine(currentLine)) {
      const chords = extractChordPositions(currentLine)
      const nextLyric = findNextLyricLine(i + 1)

      if (nextLyric) {
        result.push({ lyrics: nextLyric.line, chords, section: currentSection })
        currentSection = undefined
        i = nextLyric.index + 1
      } else {
        result.push({ lyrics: '', chords, section: currentSection })
        currentSection = undefined
        i++
      }
    } else {
      result.push({ lyrics: currentLine, chords: [], section: currentSection })
      currentSection = undefined
      i++
    }
  }

  return result
}
