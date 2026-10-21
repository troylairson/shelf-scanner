import Constants from 'expo-constants'

const WORKER_DEV_PORT = 8787

// EXPO_PUBLIC_API_URL wins. In dev, fall back to `wrangler dev` on the same machine
// as Metro, so a phone running Expo Go reaches it over the LAN with no config.
function resolveApiUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL
  if (configured) return configured.replace(/\/$/, '')
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (__DEV__ && host) return `http://${host}:${WORKER_DEV_PORT}`
  return null
}

export const API_URL = resolveApiUrl()

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export async function scanImage(base64Jpeg: string): Promise<string[]> {
  if (!API_URL) {
    throw new Error('No scan server configured. Set EXPO_PUBLIC_API_URL.')
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = process.env.EXPO_PUBLIC_APP_TOKEN
  if (token) headers['x-app-token'] = token

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: base64Jpeg, mimeType: 'image/jpeg' }),
    })
  } catch (err) {
    // Tell "server unreachable" apart from "upload failed" so errors are actionable
    const reachable = await fetch(`${API_URL}/api/health`).then((r) => r.ok, () => false)
    throw new Error(
      reachable
        ? `Upload to ${API_URL} failed: ${describe(err)}`
        : `Can't reach the scan server at ${API_URL} (${describe(err)})`
    )
  }

  const data = (await response.json().catch(() => null)) as { titles?: unknown; error?: string } | null

  if (!response.ok || !data || data.error) {
    throw new Error(data?.error ?? `Server error ${response.status}`)
  }

  return Array.isArray(data.titles) ? data.titles.filter((t): t is string => typeof t === 'string') : []
}
