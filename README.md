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
