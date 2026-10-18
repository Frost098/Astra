# Astra Companion

Multi-companion AI chat (Zeta / Verity / Prabowo) with OpenRouter-compatible providers and Fish Audio TTS.

**Live:** https://astra-companion-kappa.vercel.app

## Features
- Sidebar conversation history (create, rename, delete, search)
- Isolated sessions (no cross-chat message leakage; in-flight replies discarded on switch)
- Image attach / paste / preview
- Interactive quizzes (` ```quiz ` JSON blocks)
- Code blocks with copy
- Companions with distinct system prompts and Fish voices
- Settings: API keys, base URL, model overrides, theme
- Server-side Fish TTS via `/api/fish-tts`

## Deploy
Static `index.html` + Vercel serverless routes under `api/`.

### Environment (Vercel)
| Variable | Purpose |
|----------|---------|
| `FISH_AUDIO_API_KEY` | Fish Audio TTS (`/api/fish-tts`) |
| `FISH_TTS_MODEL` | Optional, default `s2.1-pro-free` |
| `GITHUB_TOKEN` | Optional, `/api/github` |
| `VERCEL_TOKEN` | Optional, `/api/vercel` |
| `ASTRA_PLUGIN_SECRET` | Optional shared secret for plugin routes |

Chat provider API keys are entered in the in-app Settings panel and stored only in the browser (`localStorage`).

## Local
Open `index.html` via any static server, or `vercel dev`.
