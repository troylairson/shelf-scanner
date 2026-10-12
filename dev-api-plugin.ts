import fs from 'fs'
import formidable from 'formidable'
import type { Plugin } from 'vite'

const SCAN_PROMPT = `This image shows a shelf or stack of physical media (DVDs, Blu-rays, video games, VHS tapes, or similar).
Extract all visible titles from the spines, covers, or cases.
Return ONLY a JSON array of strings with no other text.
Include your best guess for partially obscured titles.
Example: ["The Matrix", "Alien", "Halo 3", "Terminator 2"]`

async function scanWithGemini(base64: string, mimeType: string, apiKey: string): Promise<string[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
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

  if (!res.ok) {
    if (res.status === 503) throw new Error('busy')
    const body = await res.text()
    throw new Error(`Gemini ${res.status}: ${body}`)
  }

  const completion = (await res.json()) as any
  const content: string = completion.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  return parseTitles(content)
}

async function scanWithOllama(base64: string): Promise<string[]> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llava',
      prompt: SCAN_PROMPT,
      images: [base64],
      stream: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as any
  return parseTitles(data.response ?? '[]')
}

function parseTitles(content: string): string[] {
  try {
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) {
      console.warn('[dev-api] Gemini returned no JSON array. Raw response:', content)
      return []
    }
    return JSON.parse(match[0])
  } catch (e) {
    console.warn('[dev-api] Failed to parse titles JSON:', e, 'Raw content:', content)
    return []
  }
}

export function devApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/scan', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }

        let imageBuffer: Buffer
        let mimeType: string

        try {
          const form = formidable({ maxFileSize: 5 * 1024 * 1024 })
          const [, files] = await form.parse(req)
          const imageFile = files.image?.[0]
          if (!imageFile) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No image field in form data' }))
            return
          }
          imageBuffer = fs.readFileSync(imageFile.filepath)
          mimeType = imageFile.mimetype ?? 'image/jpeg'
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Failed to parse upload: ${err}` }))
          return
        }

        const base64 = imageBuffer.toString('base64')
        let titles: string[] = []
        let source = 'gemini'

        // Try Gemini first
        if (apiKey) {
          try {
            titles = await scanWithGemini(base64, mimeType, apiKey)
          } catch (geminiErr) {
            const msg = String(geminiErr)
            console.warn(`[dev-api] Gemini failed (${msg}), falling back to Ollama...`)
            source = 'ollama'

            try {
              titles = await scanWithOllama(base64)
            } catch (ollamaErr) {
              const isOllamaDown = String(ollamaErr).includes('ECONNREFUSED') || String(ollamaErr).includes('fetch failed')
              const userMsg = isOllamaDown
                ? msg.includes('busy')
                  ? 'Gemini is busy and Ollama is not running. Start Ollama or try again later.'
                  : `Scan failed: ${msg}. Ollama is also not running.`
                : `Scan failed. Gemini: ${msg} — Ollama: ${ollamaErr}`
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: userMsg }))
              return
            }
          }
        } else {
          // No Gemini key — try Ollama directly
          source = 'ollama'
          try {
            titles = await scanWithOllama(base64)
          } catch (err) {
            const isDown = String(err).includes('ECONNREFUSED') || String(err).includes('fetch failed')
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              error: isDown
                ? 'Ollama is not running. Start it with: ollama serve'
                : `Ollama error: ${err}`,
            }))
            return
          }
        }

        console.log(`[dev-api] Scan complete via ${source}: ${titles.length} titles`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ titles, source }))
      })
    },
  }
}
