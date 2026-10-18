import { bytesToBase64, scanWithGemini, scanWithOllama, ProviderError } from './scan'

export interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  // Optional: local fallback for `wrangler dev`, e.g. http://localhost:11434
  OLLAMA_URL?: string
  // Optional: if set, requests must send a matching x-app-token header.
  // This only deters casual abuse — anything shipped in the app can be extracted.
  APP_TOKEN?: string
  // Optional: Cloudflare rate limiting binding (see wrangler.toml)
  SCAN_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> }
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return json({ ok: true })
    }

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      return handleScan(request, env)
    }

    return new Response('Not Found', { status: 404 })
  },
}

async function handleScan(request: Request, env: Env): Promise<Response> {
  if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
    return jsonError('Unauthorized', 401)
  }

  if (env.SCAN_LIMITER) {
    const key = request.headers.get('cf-connecting-ip') ?? 'unknown'
    const { success } = await env.SCAN_LIMITER.limit({ key })
    if (!success) return jsonError('Too many scans — wait a minute and try again.', 429)
  }

  if (!env.GEMINI_API_KEY && !env.OLLAMA_URL) {
    return jsonError('Server has no vision provider configured (set GEMINI_API_KEY)', 500)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Invalid form data', 400)
  }

  const imageFile = formData.get('image')
  if (!imageFile || typeof imageFile === 'string') {
    return jsonError('No image provided', 400)
  }
  if (imageFile.size > MAX_IMAGE_BYTES) {
    return jsonError('Image too large (max 5MB)', 413)
  }

  const base64 = bytesToBase64(new Uint8Array(await imageFile.arrayBuffer()))
  const mimeType = imageFile.type || 'image/jpeg'

  let geminiErr: ProviderError | null = null
  if (env.GEMINI_API_KEY) {
    try {
      const titles = await scanWithGemini(base64, mimeType, env.GEMINI_API_KEY, env.GEMINI_MODEL)
      return json({ titles, source: 'gemini' })
    } catch (err) {
      console.error('Gemini error:', err)
      geminiErr = err instanceof ProviderError ? err : new ProviderError(String(err), 502)
    }
  }

  if (env.OLLAMA_URL) {
    try {
      const titles = await scanWithOllama(base64, env.OLLAMA_URL)
      return json({ titles, source: 'ollama' })
    } catch (err) {
      console.error('Ollama error:', err)
    }
  }

  if (geminiErr?.busy) {
    return jsonError('The vision service is busy right now — try again in a moment.', 503)
  }
  return jsonError('Vision API error', 502)
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonError(error: string, status: number): Response {
  return json({ error }, status)
}
