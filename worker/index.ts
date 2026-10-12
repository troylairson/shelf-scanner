export interface Env {
  GEMINI_API_KEY: string
}

const SCAN_PROMPT = `This image shows a shelf or stack of physical media (DVDs, Blu-rays, video games, VHS tapes, or similar).
Extract all visible titles from the spines, covers, or cases.
Return ONLY a JSON array of strings with no other text.
Include your best guess for partially obscured titles.
Example: ["The Matrix", "Alien", "Halo 3", "Terminator 2"]`

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      return handleScan(request, env)
    }

    return new Response('Not Found', { status: 404 })
  },
}

async function handleScan(request: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    return jsonError('GEMINI_API_KEY not configured', 500)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Invalid form data', 400)
  }

  const imageFile = formData.get('image') as File | null
  if (!imageFile) {
    return jsonError('No image provided', 400)
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    return jsonError('Image too large (max 5MB)', 400)
  }

  const arrayBuffer = await imageFile.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  const mimeType = imageFile.type || 'image/jpeg'

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SCAN_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
      }),
    }
  )

  if (!geminiRes.ok) {
    if (geminiRes.status === 503) {
      return jsonError('Gemini is busy right now — please try again in a moment.', 503)
    }
    const err = await geminiRes.text()
    console.error('Gemini error:', err)
    return jsonError('Vision API error', 502)
  }

  const completion = await geminiRes.json() as any
  const content: string = completion.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

  let titles: string[]
  try {
    const match = content.match(/\[[\s\S]*\]/)
    titles = match ? JSON.parse(match[0]) : []
  } catch {
    titles = []
  }

  return json({ titles }, 200)
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function jsonError(error: string, status: number): Response {
  return json({ error }, status)
}
