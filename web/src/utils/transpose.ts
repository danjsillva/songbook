// Notas em ordem cromática (sustenidos)
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// Notas em ordem cromática (bemóis)
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

type AccidentalPreference = 'sharp' | 'flat'

function getNoteIndex(note: string): number {
  // Normaliza bemóis para sustenidos para encontrar o índice
  const normalized = note
    .replace('Db', 'C#')
    .replace('Eb', 'D#')
    .replace('Gb', 'F#')
    .replace('Ab', 'G#')
    .replace('Bb', 'A#')

  return NOTES_SHARP.indexOf(normalized)
}

function transposeNote(note: string, semitones: number, preference: AccidentalPreference): string {
  const index = getNoteIndex(note)
  if (index === -1) return note

  const newIndex = (index + semitones + 12) % 12
  return preference === 'sharp' ? NOTES_SHARP[newIndex] : NOTES_FLAT[newIndex]
}

export function transposeChord(
  chord: string,
  semitones: number,
  preference: AccidentalPreference = 'sharp'
): string {
  if (semitones === 0) return chord

  // Regex para extrair a nota base (com possível acidente) e o resto do acorde
  // Exemplos: "Am7" -> ["A", "m7"], "C#m7/G#" -> ["C#", "m7/G#"]
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return chord

  const [, root, suffix] = match
  const transposedRoot = transposeNote(root, semitones, preference)

  // Se tem baixo alternativo (ex: C/G), transpõe também
  const bassMatch = suffix.match(/^(.*)\/([A-G][#b]?)$/)
  if (bassMatch) {
    const [, middle, bass] = bassMatch
    const transposedBass = transposeNote(bass, semitones, preference)
    return `${transposedRoot}${middle}/${transposedBass}`
  }

  return `${transposedRoot}${suffix}`
}

export function getKeyFromSemitones(
  originalKey: string | null,
  semitones: number,
  preference: AccidentalPreference = 'sharp'
): string {
  if (!originalKey) return '?'
  if (semitones === 0) return originalKey

  return transposeNote(originalKey, semitones, preference)
}

// Calcula quantos semitons entre dois tons
export function getSemitonesBetweenKeys(fromKey: string | null, toKey: string): number {
  if (!fromKey) return 0

  // Extrai apenas a nota base (sem m, 7, etc)
  const fromNote = fromKey.match(/^([A-G][#b]?)/)?.[1]
  const toNote = toKey.match(/^([A-G][#b]?)/)?.[1]

  if (!fromNote || !toNote) return 0

  const fromIndex = getNoteIndex(fromNote)
  const toIndex = getNoteIndex(toNote)

  if (fromIndex === -1 || toIndex === -1) return 0

  return (toIndex - fromIndex + 12) % 12
}
