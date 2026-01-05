// Integração com Groq LLM para extração de músicas

export interface ExtractedSongData {
  title: string
  artist: string
  originalKey: string | null
  lyrics: string
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const SYSTEM_PROMPT = `Você é especialista em extrair cifras de páginas HTML.
Sua tarefa é extrair informações de sites de cifras (Cifra Club, Ultimate Guitar, etc).

RETORNE APENAS um objeto JSON válido com esta estrutura:
{
  "title": "Nome da música",
  "artist": "Nome do artista/banda",
  "originalKey": "Tom original (ex: G, Am, C#m) ou null se não encontrado",
  "lyrics": "Letra completa com acordes posicionados acima das sílabas"
}

Para o campo "lyrics":
- Mantenha acordes na linha ACIMA da letra correspondente
- Preserve espaços para alinhar acordes com sílabas corretas
- INCLUA marcadores de seção no formato [Seção] em linhas separadas
- PRESERVE os marcadores originais da página (ex: [Primeira Parte], [Segunda Parte])
- Se a página não tem marcadores, adicione-os em português
- Mantenha linhas em branco entre seções
- NÃO inclua tablaturas, apenas acordes e letra

Exemplo de formato:
[Intro]
G  D  Em  C

[Primeira Parte]
        G                D
Quando eu digo que deixei de te amar
        Em               C
É porque eu te amo

[Refrão]
        C                G
E é por isso que eu canto

IMPORTANTE:
- Não inclua HTML, scripts ou estilos
- Não invente dados - extraia apenas o que está na página
- Preserve os marcadores originais da página quando existirem
- Se não houver marcadores, adicione-os baseado na estrutura
- Se um campo não for encontrado, use null ou string vazia
- Retorne APENAS o JSON, sem markdown ou explicações`

async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Site bloqueou o acesso. Tente copiar a cifra manualmente.')
    }
    if (response.status === 404) {
      throw new Error('Página não encontrada. Verifique o link.')
    }
    throw new Error(`Erro ao acessar URL: ${response.status}`)
  }

  return response.text()
}

function extractRelevantContent(html: string): string {
  let result = ''

  // 1. Extrair metadados da div g-side-ad
  const sideAdMatch = html.match(/<div[^>]*class="[^"]*g-side-ad[^"]*"[^>]*>([\s\S]*?)(?=<pre|<div class="cifra)/i)
  if (sideAdMatch) {
    let meta = sideAdMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    result += meta + '\n\n'
  }

  // 2. Extrair cifra do <pre>
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)
  if (preMatch) {
    let cifra = preMatch[1]
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')

    result += 'CIFRA:\n' + cifra
  }

  if (result.trim()) {
    return result.substring(0, 20000)
  }

  // Fallback: truncar HTML
  return html.substring(0, 20000)
}

async function callGroqLlm(html: string, apiKey: string): Promise<ExtractedSongData> {
  // Extrair apenas conteúdo relevante
  const relevantContent = extractRelevantContent(html)
  console.log('Sending to Groq (first 300 chars):', relevantContent.substring(0, 300))

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Extraia os dados da cifra do seguinte conteúdo:\n\n${relevantContent}\n\nRetorne APENAS o JSON.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.')
    }
    const errorText = await response.text()
    throw new Error(`Erro na API Groq: ${response.status} - ${errorText}`)
  }

  const data = await response.json() as GroqResponse
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('Resposta vazia da IA')
  }

  // Extrair campos usando regex (mais robusto que JSON.parse)
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/)
  const artistMatch = content.match(/"artist"\s*:\s*"([^"]+)"/)
  // originalKey pode ser "G", "Am" ou null
  const keyMatch = content.match(/"originalKey"\s*:\s*(?:"([^"]+)"|null)/)

  // Extrair lyrics (pode ter quebras de linha)
  const lyricsMatch = content.match(/"lyrics"\s*:\s*"([\s\S]*?)"\s*\}/)

  const title = titleMatch?.[1] || ''
  const artist = artistMatch?.[1] || ''
  const originalKey = keyMatch?.[1] || null // Se casou com null, [1] é undefined -> null
  let lyrics = lyricsMatch?.[1] || ''

  // Converter escape sequences
  lyrics = lyrics
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')

  console.log('Extracted:', { title, artist, originalKey, lyricsLength: lyrics.length })

  return validateExtractedData({ title, artist, originalKey, lyrics })
}

function validateExtractedData(data: unknown): ExtractedSongData {
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta inválida da IA')
  }

  const obj = data as Record<string, unknown>

  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    throw new Error('Título não encontrado na página')
  }

  // Artista pode estar vazio se não encontrado (usuário pode preencher manualmente)
  const artist = typeof obj.artist === 'string' ? obj.artist.trim() : ''

  if (typeof obj.lyrics !== 'string' || !obj.lyrics.trim()) {
    throw new Error('Cifra não encontrada na página')
  }

  return {
    title: (obj.title as string).trim(),
    artist,
    originalKey: typeof obj.originalKey === 'string' && obj.originalKey.trim()
      ? obj.originalKey.trim()
      : null,
    lyrics: (obj.lyrics as string).trim(),
  }
}

export async function extractSongFromUrl(
  url: string,
  apiKey: string
): Promise<ExtractedSongData> {
  // 1. Validar URL
  try {
    new URL(url)
  } catch {
    throw new Error('URL inválida')
  }

  // 2. Fetch do HTML da página
  const html = await fetchPageHtml(url)

  // 3. Chamar Groq LLM para extrair dados
  const extracted = await callGroqLlm(html, apiKey)

  return extracted
}

// Prompt for section classification
const CLASSIFY_SECTIONS_PROMPT = `Você é especialista em analisar músicas e cifras.
Sua tarefa é identificar e marcar seções em uma cifra que ainda não tem marcadores.

RETORNE a cifra EXATAMENTE como recebida, mas ADICIONANDO marcadores de seção no formato [Seção] em linhas separadas ANTES de cada seção.

Use marcadores em português como:
- [Intro] - introdução instrumental
- [Verso] ou [Primeira Parte], [Segunda Parte] - estrofes
- [Pré-Refrão] - parte que prepara o refrão
- [Refrão] - parte que repete (pode usar [Refrão 2x] se repetir)
- [Ponte] - seção de transição
- [Solo] - solos instrumentais
- [Final] - encerramento
- [Instrumental] - partes instrumentais no meio

REGRAS IMPORTANTES:
1. NÃO modifique acordes ou letra existentes
2. NÃO remova linhas em branco existentes
3. APENAS adicione marcadores [Seção] em novas linhas antes de cada seção
4. Se a cifra já tiver marcadores, preserve-os
5. Identifique seções pela estrutura: refrões geralmente repetem, versos têm melodias similares
6. Retorne APENAS a cifra com marcadores, sem explicações

Exemplo de entrada:
G  D  Em  C

        G                D
Quando eu digo que deixei de te amar
        Em               C
É porque eu te amo

        G                D
Quando eu digo que deixei de te amar
        Em               C
É porque eu te amo

        C                G
E por isso que eu canto
        D                Em
Cada vez mais alto

Exemplo de saída:
[Intro]
G  D  Em  C

[Verso]
        G                D
Quando eu digo que deixei de te amar
        Em               C
É porque eu te amo

[Verso]
        G                D
Quando eu digo que deixei de te amar
        Em               C
É porque eu te amo

[Refrão]
        C                G
E por isso que eu canto
        D                Em
Cada vez mais alto`

export async function classifySongSections(
  lyrics: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: CLASSIFY_SECTIONS_PROMPT,
        },
        {
          role: 'user',
          content: `Adicione marcadores de seção à seguinte cifra:\n\n${lyrics}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.')
    }
    const errorText = await response.text()
    throw new Error(`Erro na API Groq: ${response.status} - ${errorText}`)
  }

  const data = await response.json() as GroqResponse
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('Resposta vazia da IA')
  }

  return content.trim()
}
