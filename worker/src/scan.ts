export const SCAN_PROMPT = `This image shows a shelf or stack of physical media (DVDs, Blu-rays, video games, VHS tapes, or similar).
Extract all visible titles from the spines, covers, or cases.
Return ONLY a JSON array of strings with no other text.
Include your best guess for partially obscured titles.
Example: ["The Matrix", "Alien", "Halo 3", "Terminator 2"]`

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

export class ProviderError extends Error {
  readonly status: number
  readonly busy: boolean

  constructor(message: string, status: number, busy = false) {
    super(message)
    this.status = status
    this.busy = busy
  }
}

// Spreading a whole image into String.fromCharCode overflows the engine's argument
// limit (RangeError) for anything over ~100KB, so encode in chunks.
export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function parseTitles(content: string): string[] {
  const match = content.match(/\[[\s\S]*\]/)
  if (!match) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const seen = new Set<string>()
  const titles: string[] = []
  for (const item of parsed) {
    if (typeof item !== 'string') continue
    const title = item.trim()
    const key = title.toLowerCase()
    if (!title || seen.has(key)) continue
    seen.add(key)
    titles.push(title)
  }
  return titles
}

export async function scanWithGemini(
  base64: string,
  mimeType: string,
  apiKey: string,
  model = DEFAULT_GEMINI_MODEL
): Promise<string[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      // Header rather than ?key= so the key never lands in URL logs
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SCAN_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    const busy = res.status === 503 || res.status === 429
    throw new ProviderError(`Gemini ${res.status}: ${await res.text()}`, res.status, busy)
  }

  const completion = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return parseTitles(completion.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]')
}

export async function scanWithOllama(base64: string, baseUrl: string, model = 'llava'): Promise<string[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: SCAN_PROMPT, images: [base64], stream: false }),
  })

  if (!res.ok) {
    throw new ProviderError(`Ollama ${res.status}: ${await res.text()}`, res.status)
  }

  const data = (await res.json()) as { response?: string }
  return parseTitles(data.response ?? '[]')
}
