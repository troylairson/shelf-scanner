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

  const upload = await readUpload(request)
  if ('error' in upload) return jsonError(upload.error, upload.status)
  const { base64, mimeType } = upload

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

type Upload = { base64: string; mimeType: string } | { error: string; status: number }

// The app sends JSON { image: <base64>, mimeType }; multipart (field "image") is kept for curl testing
async function readUpload(request: Request): Promise<Upload> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    let body: { image?: unknown; mimeType?: unknown }
    try {
      body = await request.json()
    } catch {
      return { error: 'Invalid JSON body', status: 400 }
    }
    if (typeof body.image !== 'string' || !body.image) {
      return { error: 'No image provided', status: 400 }
    }
    // base64 is 4/3 the size of the bytes it encodes
    if ((body.image.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return { error: 'Image too large (max 5MB)', status: 413 }
    }
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg'
    return { base64: body.image, mimeType }
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return { error: 'Invalid form data', status: 400 }
  }
  const imageFile = formData.get('image')
  if (!imageFile || typeof imageFile === 'string') {
    return { error: 'No image provided', status: 400 }
  }
  if (imageFile.size > MAX_IMAGE_BYTES) {
    return { error: 'Image too large (max 5MB)', status: 413 }
  }
  return {
    base64: bytesToBase64(new Uint8Array(await imageFile.arrayBuffer())),
    mimeType: imageFile.type || 'image/jpeg',
  }
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
