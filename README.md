# jingyier

jingyier is a curated, lightweight static site built with Astro. The first version uses an editorial magazine style, static content collections, and a small Vercel-compatible JSON API.

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
- `src/components`: small layout/list components.
- `src/styles`: design tokens and global editorial layout.
- `api/site.ts`: Vercel JSON API example.

## Assets

Phase 1 uses remote Unsplash placeholders to establish the visual direction without committing unverified files. Before production launch:

1. Search Unsplash or Pexels with: `art studio`, `editorial layout`, `gallery wall`, `paper texture`, `quiet interior`, `artist desk`, `museum light`.
2. Download selected images into `src/assets/images`.
3. Update the `cover` fields in `src/content/work/*.md`.
4. Update `src/content/assets-log.json` with author, source URL, download date, license, and usage.

Avoid obvious stock imagery, visible trademarks, or identifiable faces unless the license and consent are clear.

## Deployment

- Cloudflare Pages: build command `npm run build`, output directory `dist`.
- Vercel API: deploy the `api/` directory if runtime JSON endpoints are needed.
- Keep `.npm-cache` local only; it is ignored by git.
