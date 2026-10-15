# Astra Companion

Smart character chat (Zeta / Verity / Prabowo) + Fish Audio TTS.

## Live
https://astra-companion-kappa.vercel.app

## How it loads
`index.html` is a small bootloader. It fetches `ui.p0.b64` … `ui.p2.b64`, gunzips, and writes the full app.

## Env (Vercel)
- `FISH_AUDIO_API_KEY` — required for `/api/fish-tts`

## Repo layout
- `index.html` — boot
- `ui.p*.b64` — gzipped app chunks
- `api/fish-tts.js` — TTS proxy
- `api/github.js`, `api/vercel.js`, `api/plugin-health.js` — plugins
