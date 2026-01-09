import type { SongLine, ChordPosition } from '@songbook/shared'
import { chordParserFactory } from 'chord-symbol'

// Cria o parser de acordes usando a biblioteca chord-symbol
// que suporta 37.000+ variações de acordes
const parseChord = chordParserFactory()

// Detecta se uma linha é um marcador de seção [qualquer texto]
function parseSectionMarker(line: string): string | null {
  const trimmed = line.trim()
  // Aceita marcadores entre colchetes [Texto] ou parênteses (Texto)
  const match = trimmed.match(/^[\[\(]([^\]\)]+)[\]\)]$/)
  if (!match) return null

  return match[1].trim()
}

function isChordToken(token: string): boolean {
  const result = parseChord(token.trim())
  // Se não tem 'error' no resultado, é um acorde válido
  return !('error' in result)
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

    // Pula linhas vazias
    if (!currentLine.trim()) {
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

    // Se linha atual é de acordes
    if (isChordLine(currentLine)) {
      const chords = extractChordPositions(currentLine)
      const nextLyric = findNextLyricLine(i + 1)

      if (nextLyric) {
        result.push({
          lyrics: nextLyric.line,
          chords,
          section: currentSection
        })
        currentSection = undefined
        i = nextLyric.index + 1
      } else {
        // Linha só de acordes (sem letra abaixo)
        result.push({
          lyrics: '',
          chords,
          section: currentSection
        })
        currentSection = undefined
        i++
      }
    } else {
      // Linha só de letra
      result.push({
        lyrics: currentLine,
        chords: [],
        section: currentSection
      })
      currentSection = undefined
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
