import type { SongLine } from '@songbook/shared'

// Converte o content salvo de volta para texto editável
export function contentToText(lines: SongLine[]): string {
  const result: string[] = []

  for (const line of lines) {
    // Se tem acordes, gera linha de acordes
    if (line.chords.length > 0) {
      let chordLine = ''
      let lastEnd = 0

      for (const { chord, position } of line.chords) {
        const spaces = Math.max(0, position - lastEnd)
        chordLine += ' '.repeat(spaces) + chord
        lastEnd = position + chord.length
      }

      result.push(chordLine)
    }

    // Adiciona linha de letra (ou linha vazia)
    result.push(line.lyrics)
  }

  return result.join('\n')
}
