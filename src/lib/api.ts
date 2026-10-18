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

export async function scanImage(uri: string): Promise<string[]> {
  if (!API_URL) {
    throw new Error('No scan server configured. Set EXPO_PUBLIC_API_URL.')
  }

  const formData = new FormData()
  // React Native's FormData accepts a file descriptor object in place of a Blob
  formData.append('image', { uri, name: 'scan.jpg', type: 'image/jpeg' } as unknown as Blob)

  const headers: Record<string, string> = {}
  const token = process.env.EXPO_PUBLIC_APP_TOKEN
  if (token) headers['x-app-token'] = token

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/scan`, { method: 'POST', body: formData, headers })
  } catch {
    throw new Error(`Can't reach the scan server at ${API_URL}`)
  }

  const data = (await response.json().catch(() => null)) as { titles?: unknown; error?: string } | null

  if (!response.ok || !data || data.error) {
    throw new Error(data?.error ?? `Server error ${response.status}`)
  }

  return Array.isArray(data.titles) ? data.titles.filter((t): t is string => typeof t === 'string') : []
}
