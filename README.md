# jingyier

jingyier is an Astro personal site with a dark immersive shell: fixed navigation, blurred local artwork, glass panels, floating shortcuts, a preview music player, notes, work entries, a visitor message flow, and the standalone Silent Bloom Garden room.

The current frontend direction is inspired by a treasure-site / personal portal layout. It imitates the structure and atmosphere, not the reference site's content, assets, or technology stack.

## Commands

```bash
npm install --cache .npm-cache
npm run dev
npm run build
npm run preview
```

Extra verification helpers:

```bash
npm run verify:static
npm run verify:deploy
```

## Site Shape

- `/`: immersive personal portal with search, profile panel, Cloud Music preview, quote strip, content tiles, tools, recent Notes/Work, and messages.
- `/notes`: archive/search style note page with tag filtering and `aria-live` status updates.
- `/work`: Projects Matrix style work page with type filtering and project entries.
- `/music`: music preview page backed by static metadata and `/api/music`.
- `/about`: glass-cover profile page using existing jingyier copy.
- `/garden`: Silent Bloom Garden, a separate interactive room. It is not the site homepage identity.
- `/api/messages`: Cloudflare Pages Function for reviewed visitor messages.
- `/api/music`: Cloudflare Pages Function returning static music metadata.

## Structure

- `src/pages`: Astro pages, RSS, sitemap, and 404.
- `src/components/SiteShell.astro`: shared immersive site chrome, navigation, background layer, dock, and global player.
- `src/components/NoteList.astro`: note archive rows, preserving filter `data-*` hooks.
- `src/components/WorkList.astro`: project archive rows, preserving filter `data-*` hooks.
- `src/content/notes`: Astro Content Collection entries for Notes.
- `src/content/work`: Astro Content Collection entries for Work.
- `src/content/home.json`: homepage quotes, utility copy, status copy, and static message history.
- `src/content/music.json`: static music metadata and lyric fallback.
- `src/styles/tokens.css`: shared color, typography, motion, editorial, and treasure-shell tokens.
- `src/styles/global.css`: global layout, immersive shell, content pages, garden room, and responsive rules.
- `src/scripts/home.js`: homepage clock, utility toggles, quote rotation, message submit, and localStorage fallback.
- `src/scripts/music.js`: global and page music preview state.
- `src/scripts/content-filter.js`: shared Notes/Work filtering behavior via `data-*` hooks.
- `functions/api/messages.ts`: Cloudflare Pages Function for visitor messages.
- `functions/api/music.ts`: Cloudflare Pages Function for music metadata.
- `db/schema.sql`: Cloudflare D1 schema for reviewed messages.

## Messages

The homepage message form keeps historical messages visible even when the API is unavailable:

- Static history comes from `src/content/home.json`.
- Browser-local messages are stored under `jingyier.home.messages`.
- Localhost and plain static previews skip remote `/api/messages`, so `astro dev` or `dist` preview does not hide message history after a 404.
- Production still uses `POST /api/messages` first. Valid messages are written to D1 as `status='pending'`.
- Production `GET /api/messages` returns latest approved messages only.

Manual approval can be done in the Cloudflare D1 console:

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

## Music

`/music` and the global player read the same static fallback from `src/content/music.json`. `/api/music` returns:

```json
{ "ok": true, "currentTrack": {}, "tracks": [], "lyrics": [] }
```

No real audio is bundled in this version. Tracks with no `audioSrc` run in preview mode: controls update UI state, but no copyrighted or missing audio file is requested.

## Assets

The immersive shell reuses local Silent Bloom assets from `public/images/silent-bloom/` for blurred backgrounds and music artwork. Do not copy reference-site screenshots or copyrighted music/media into this repo.

When adding or replacing Silent Bloom assets:

1. Add source PNGs under `public/images/silent-bloom/`.
2. Generate matching `.webp` files for production use.
3. Update references in pages, scripts, or `src/content/music.json`.
4. Update `src/content/assets-log.json` with source, date, license, and usage notes.

## Deployment

- Cloudflare Pages: build command `npm run build`, output directory `dist`.
- Messages API: deploy on Cloudflare Pages Functions and bind D1 as `DB`.
- D1 database: create `jingyier_messages`, then apply `db/schema.sql`.
- Local static verification: `npm run verify:static`.
- Deployment verification after Cloudflare publishes: `npm run verify:deploy` or `npm run verify:deploy -- https://your-preview.pages.dev`.
- Keep `.npm-cache` local only; it is ignored by git.

## Design Notes

- Keep Astro + TypeScript + native CSS. Do not introduce React, Next, Tailwind, or a large UI library for this shell.
- The public site uses a dark fixed-nav shell, blurred local imagery, glass panels, soft glows, floating shortcuts, search bars, and a compact global player.
- `/garden` remains an independent room and should not be covered by global chrome.
- Preserve `home.js`, `music.js`, and `content-filter.js` behavior contracts by keeping their `data-*` hooks stable.
- Preserve existing Content Collections and `/api/messages` request/response behavior.
