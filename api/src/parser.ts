import type { SongLine, ChordPosition } from '@songbook/shared'

// Regex para detectar acordes
// Suporta: C, Cm, C7, Cmaj7, C#, Bb, C/G, C#m7/G#, etc.
const CHORD_REGEX = /^[A-G][#b]?(m|dim|aug|maj|sus|add)?\d*(\([^)]+\))?(\/[A-G][#b]?)?$/

function isChordToken(token: string): boolean {
  return CHORD_REGEX.test(token.trim())
}

function isChordLine(line: string): boolean {
  if (!line.trim()) return false

  const tokens = line.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false

  // Linha é de acordes se a maioria dos tokens são acordes
  const chordCount = tokens.filter(isChordToken).length
  return chordCount / tokens.length >= 0.5
}

// Remove tags HTML e retorna texto limpo
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

// Extrai posições dos acordes de uma linha
function extractChordPositions(chordLine: string): ChordPosition[] {
  const positions: ChordPosition[] = []
  let currentPos = 0

  // Encontra cada acorde e sua posição
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

export function parseHtmlToSongLines(html: string): SongLine[] {
  const text = stripHtml(html)
  const rawLines = text.split('\n')
  const result: SongLine[] = []

  let i = 0
  while (i < rawLines.length) {
    const currentLine = rawLines[i]
    const nextLine = rawLines[i + 1]

    // Pula linhas vazias
    if (!currentLine.trim()) {
      // Adiciona linha vazia para manter estrutura
      result.push({ lyrics: '', chords: [] })
      i++
      continue
    }

    // Se linha atual é de acordes
    if (isChordLine(currentLine)) {
      const chords = extractChordPositions(currentLine)

      // Se próxima linha existe e não é de acordes, combina
      if (nextLine && !isChordLine(nextLine)) {
        result.push({
          lyrics: nextLine,
          chords
        })
        i += 2
      } else {
        // Linha só de acordes (sem letra abaixo)
        result.push({
          lyrics: '',
          chords
        })
        i++
      }
    } else {
      // Linha só de letra
      result.push({
        lyrics: currentLine,
        chords: []
      })
      i++
    }
  }

  return result
}

export function generatePlainText(lines: SongLine[]): string {
  return lines
    .map(line => line.lyrics)
    .filter(Boolean)
    .join('\n')
}

// Detecta tom original analisando os acordes
export function detectKey(lines: SongLine[]): string | null {
  const allChords: string[] = []

  for (const line of lines) {
    for (const { chord } of line.chords) {
      allChords.push(chord)
    }
  }

  if (allChords.length === 0) return null

  // Primeiro acorde é frequentemente o tom
  // (heurística simples, pode ser melhorada)
  const firstChord = allChords[0]

  // Extrai nota base (remove modificadores)
  const match = firstChord.match(/^([A-G][#b]?)/)
  return match ? match[1] : null
}
