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
- `api/site.ts`: Vercel JSON API example.

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
- Vercel API: deploy the `api/` directory if runtime JSON endpoints are needed.
- Keep `.npm-cache` local only; it is ignored by git.

## Future Service Notes

The current homepage widgets are static or browser-local by design:

- Messages are saved only in the visitor's browser with `localStorage`.
- Weather uses local static copy and does not request location or external APIs.
- Quotes, status text, and widget copy come from `src/content/home.json`.

Possible future upgrades:

1. Visitor messages: third-party form service, serverless endpoint, or GitHub Issues/Discussions as the backing store.
2. Weather: use a configured default city first, never browser location by default, and always fall back to static copy.
3. Archive/search: add static tag filters for Notes and Work before introducing a hosted search service.
