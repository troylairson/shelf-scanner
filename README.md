# Shelf Scanner

Point your phone at a shelf of DVDs, Blu-rays or games and find out which titles on your
**wanted list** are on it. Built with Expo, so it runs in **Expo Go** with no native build.

- **Scan** — take a photo (or pick one); a vision model reads the titles on the spines.
- **Match** — titles are fuzzy-matched against your wanted list, ignoring noise like
  "Special Edition", "Blu-ray" or "(1999)".
- **Wanted** — add titles one at a time or bulk-import a pasted list (one per line).
- **History** — the last 50 scans, stored on the device.

All your data stays on the phone (AsyncStorage). The only server is a small Cloudflare
Worker that forwards photos to Gemini so the API key never ships in the app.

## Layout

| Path | What |
| --- | --- |
| `App.tsx`, `src/` | The Expo / React Native app |
| `src/lib/titleMatcher.ts` | Fuzzy matching (Fuse.js) |
| `src/lib/api.ts` | Uploads photos to the Worker |
| `worker/` | Cloudflare Worker: `POST /api/scan` → Gemini (optional Ollama fallback) |
| `tests/` | `node:test` tests for the matcher and the Worker's parsing/encoding |

## Run it in Expo Go

You need Node 22+, and the **Expo Go** app (SDK 58) on your phone, on the same Wi‑Fi as your computer.

```bash
npm install
(cd worker && npm install)

# 1. Start the scan server (terminal 1)
echo "GEMINI_API_KEY=AIza..." > worker/.dev.vars   # free key: https://aistudio.google.com/app/apikey
npm --prefix worker run dev                         # listens on 0.0.0.0:8787

# 2. Start the app (terminal 2) and scan the QR code with Expo Go
npm start
```

In development the app talks to `http://<your computer's LAN IP>:8787` automatically
(derived from the Metro host), so there is nothing to configure. If your network
blocks LAN traffic, use `npx expo start --tunnel` and point `EXPO_PUBLIC_API_URL` at a
deployed Worker instead.

No Gemini key? Run [Ollama](https://ollama.com) with `llava` and put
`OLLAMA_URL=http://localhost:11434` in `worker/.dev.vars`; it is also used as a fallback when Gemini fails.

## Deploy the Worker

```bash
cd worker
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put APP_TOKEN      # optional shared token
npx wrangler deploy
```

Then set, in `.env.local` at the repo root:

```
EXPO_PUBLIC_API_URL=https://shelf-scanner.<subdomain>.workers.dev
EXPO_PUBLIC_APP_TOKEN=<same as APP_TOKEN, if you set one>
```

The Worker limits each IP to 20 scans a minute (`[[ratelimits]]` in `worker/wrangler.toml`).
`APP_TOKEN` only stops casual abuse — anything bundled in an app can be extracted.

## Checks

```bash
npm run typecheck                 # app
npm --prefix worker run typecheck # worker
npm test                          # matcher + worker unit tests
```
