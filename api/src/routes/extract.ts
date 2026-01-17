import { extractSongFromUrl } from '../groq'
import { json, error } from '../lib/response'
import { requireAuth } from '../middleware/auth'
import type { Env } from '../lib/types'
import type { ExtractFromUrlInput } from '@songbook/shared'

// POST /api/extract - Extract song data from URL via Groq LLM
export async function extractFromUrl(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult

  const input = await request.json<ExtractFromUrlInput>()

  if (!input.url) {
    return error('Missing required field: url')
  }

  if (!env.GROQ_API_KEY) {
    return error('GROQ_API_KEY not configured', 500)
  }

  try {
    const extracted = await extractSongFromUrl(input.url, env.GROQ_API_KEY)
    return json(extracted)
  } catch (err) {
    console.error('Extraction error:', err)
    return error(
      err instanceof Error ? err.message : 'Falha ao extrair dados da música',
      500
    )
  }
}
