# SpellMaster AI (React + Vite)

React version of the SpellMaster app with Tailwind styling, OpenRouter-powered AI hints, and local word collection storage.

## Setup

1. Install deps: `npm install`
2. Copy env: `cp .env.example .env.local`
3. Add your OpenRouter key to `.env.local` (`VITE_OPENROUTER_API_KEY=sk-or-...`). Optional: set `VITE_OPENROUTER_MODEL` (defaults to `gpt-4o-mini`) or `VITE_OPENROUTER_BASE_URL`.
4. Start dev server: `npm run dev`

## Notes

- Word collection persists in `localStorage` under `spellmaster_db_v1`.
- AI features (smart add, hints, meaning check, story) require the OpenRouter key.
- Tailwind + tailwindcss-animate provide the UI animations used throughout the app.

## Deployment

### Railway

This project is configured for deployment on [Railway](https://railway.app/).

1. Fork or push this repo to GitHub.
2. Create a new project on Railway and select "Deploy from GitHub repo".
3. Railway will automatically detect `railway.toml` and build the app using `npm run build`.
4. The app will be served using `serve` as configured in `railway.toml`.
