# jingyier

jingyier is a lightweight Astro personal site for notes, quotes, small widgets, project entries, and a few experiments. Silent Bloom Garden is kept as a standalone interactive room at `/garden`, rather than the identity of the whole site.

## Commands

```bash
npm install --cache .npm-cache
npm run dev
npm run build
npm run preview
```

## Structure

- `src/pages`: static pages, RSS, sitemap, and 404.
- `src/content/work`: work collection entries.
- `src/content/notes`: note collection entries.
- `src/content/home.json`: homepage quotes, static messages, and small widget copy.
- `src/content/floating-info.json`: legacy glass-note content retained for possible reuse.
- `src/components`: small layout/list components.
- `src/styles`: design tokens, personal homepage styles, garden prototype styles, content pages, and glass layer.
- `functions/api/messages.ts`: Cloudflare Pages Function for visitor messages.
- `db/schema.sql`: Cloudflare D1 schema for reviewed messages.
- `api/site.ts`: historical Vercel JSON API example; not used for messages.

## Assets

Silent Bloom Garden assets live in `public/images/silent-bloom/`. PNG originals are kept as source material, while WebP files are used by the garden room for lighter loading.

When adding or replacing assets:

1. Add source PNGs under `public/images/silent-bloom/`.
2. Generate matching `.webp` files for production use.
3. Update any references in `src/pages/index.astro` or `src/scripts/silent-bloom.js`.
4. Update `src/content/assets-log.json` with source, date, license, and usage notes.

## Deployment

- Cloudflare Pages: build command `npm run build`, output directory `dist`.
- Local static verification: `npm run verify:static`.
- Deployment verification after Cloudflare publishes: `npm run verify:deploy` or `npm run verify:deploy -- https://your-preview.pages.dev`.
- Messages API: deploy on Cloudflare Pages Functions and bind D1 as `DB`.
- D1 database: create `jingyier_messages`, then apply `db/schema.sql`.
- Keep `.npm-cache` local only; it is ignored by git.

## Messages

The homepage message form now tries `/api/messages` first:

- `POST /api/messages` writes valid messages to D1 as `status='pending'`.
- `GET /api/messages` returns the latest approved messages only.
- Manual approval can be done in the Cloudflare D1 console:

```sql
SELECT id, body, status, created_at
FROM messages
WHERE status='pending'
ORDER BY created_at DESC
LIMIT 20;

UPDATE messages
SET status='approved'
WHERE id='paste-the-message-id-here';
```

If the API or D1 binding is unavailable, the page falls back to the browser-local `localStorage` message flow.

## Future Service Notes

The remaining homepage widgets are static or browser-local by design:
- Weather uses local static copy and does not request location or external APIs.
- Quotes, status text, and widget copy come from `src/content/home.json`.

Possible future upgrades:

1. Visitor messages: add Turnstile, rate limiting, or a small moderation UI if manual D1 console approval becomes tedious.
2. Weather: use a configured default city first, never browser location by default, and always fall back to static copy.
3. Archive/search: add static tag filters for Notes and Work before introducing a hosted search service.
