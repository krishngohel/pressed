# Pressed — *Your career, polished.*

**Pressed by Meridia** is a full-stack career application platform: a structured career **Vault**, an AI **Resume Generator** with a click-to-edit WYSIWYG editor (LaTeX under the hood, never visible), a kanban **Job Tracker**, and a **Gmail Connector** that surfaces interviews, offers and deadlines.

React 18 + Vite + Tailwind v3 · Express on Netlify Functions · Supabase (Auth + Postgres) · Stripe · Anthropic Claude (`claude-sonnet-4-6` with ephemeral prompt caching) · SwiftLaTeX (WASM) · PDF.js

## Quick start

```bash
npm install
cp .env.example .env        # fill in keys (see below)
npm run dev                 # frontend on :5173
# in another terminal, for the API:
npx netlify dev             # functions on :8888 (the Vite proxy targets this)
```

### 1. Supabase
Create a project, then run `supabase/schema.sql` in the SQL editor. Copy the project URL, anon key (frontend) and service-role key (backend) into `.env`.

### 2. SwiftLaTeX (required for resume compilation)
Download `PdfTeXEngine.js`, `swiftlatexpdftex.js` and `swiftlatexpdftex.wasm` from the [SwiftLaTeX releases](https://github.com/SwiftLaTeX/SwiftLaTeX/releases) into `public/swiftlatex/`. Compilation happens entirely in the browser — no server LaTeX runtime.

### 3. Stripe
Create three prices — Pro Monthly **$15/mo**, Pro Annual **$120/yr**, Lifetime **$299 one-time** — and set their IDs in `.env`. Point a webhook at `/api/stripe/webhook` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`.

### 4. Google OAuth (Gmail connector)
Create an OAuth client in Google Cloud Console with scope `gmail.readonly`, redirect URI `<APP_URL>/api/gmail/callback`. **Tokens are stored AES-256-GCM encrypted** (key derived from `JWT_SECRET`) — never plaintext. See `routes/gmail.js`.

### 5. Deploy
Push to a repo and connect to Netlify — `netlify.toml` handles build, functions and redirects. Set all backend env vars in the Netlify dashboard.

## Architecture notes

- **LaTeX is never user-visible.** Resumes store an *expanded template with `{{{KEY}}}` markers* + a flat `placeholders` map. The PDF.js text layer maps placeholder values to bounding boxes; invisible `contentEditable` overlays let users edit text directly on the preview. Edits mutate the map, debounce 800ms, re-fill, recompile in WASM.
- **Vault is the RAG source of truth.** Every `/resumes/generate` call pulls live vault entries; `vault_snapshot` exists only for history.
- **Prompt caching everywhere.** All Claude calls put the vault context block under `cache_control: {type: "ephemeral"}`.
- **Pro gating, twice.** Backend routes return `403 {error:'pro_required'}`; the frontend listens and shows the upgrade modal — never a hard error.
- **Theme engine.** Six presets (navy-first, plus a Clay homage to Scrubbed) injected via `<style id="theme-overrides">` before paint, persisted to localStorage and `profiles.theme_preset`.

## Plans

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | Vault, Job Tracker, 1 AI resume parse, 2 themes |
| Pro Monthly | $15/mo | Generator, WYSIWYG editor, Tailor, Gmail, unlimited parsing, history, all themes |
| Pro Annual | $120/yr | Everything in Pro, two months free |
| Lifetime | $299 | Everything, forever |
