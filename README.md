# dshaker.space

Galaxy-themed personal site, deployed on [Cloudflare Pages](https://pages.cloudflare.com).

**Live site:** [dshaker.space](https://dshaker.space)

## What's Here

| File | What it does |
|---|---|
| `index.html` | Main page — orbital animations, starfield, nebula blobs, CLI console |
| `dashboard.html` | System status cards (live via Pages Function `/api/services/status`) |
| `eggs.html` | Easter-egg laboratory (client-side endpoints) |
| `files.html` | File browser UI (backed by `/api/files`, R2 pending) |
| `kandan.html` | Kanban & notes scratch pad (password-gated, backed by `/api/kandan` over KV) |
| `contact.html` | Ways to reach the mothership (mailto button — no backend) |
| `retro.html` | The Retro Zone — Win95 + Geocities nostalgia page |
| `calculator.html` | Win95 Calculator app (reached from the Retro start menu) |
| `boot.html` | Win95 System Boot screen app (reached from the Retro start menu) |
| `notepad.html` | Win95 Notepad app (reached from the Retro start menu) |
| `404.html` | Themed lost-in-space 404 |
| `styles.css` | All styling — galaxy theme, light/dark mode |
| `main.js` | Client-side interactivity — starfield, theme, CLI, files, dashboard |
| `wrangler.toml` | Pages config — binds the `KANDAN` KV namespace for the board |
| `_headers` | Security headers applied by Cloudflare Pages (CSP, nosniff, etc.) |
| `functions/` | Cloudflare Pages Functions — the backend API |

## The API (`functions/`)

Pages Functions are auto-deployed by Cloudflare on push (no build step). They live
at `functions/` and map 1:1 to URL paths.

| Route | File | Status |
|---|---|---|
| `GET /api/services/status` | `functions/api/services/status.js` | ✅ Live — powers the dashboard |
| `GET /api/files` | `functions/api/files/index.js` | ✅ Live (empty list) — see below to enable uploads |
| `GET/POST /api/kandan` | `functions/api/kandan.js` | ✅ Live — persists the Kandan board to the `KANDAN` KV namespace |

### The Kandan board (`/kandan`)

> **Security (2026-08-27):** the board is **read-only to the public** — anyone can
> view, but **writes require a key** checked server-side; `POST /api/kandan` returns
> 403 without one (via `?key=` or `X-Kandan-Key` header). Two accepted keys:
> **`KANDAN_KEY`** (secure random — the agent/CLI/Telegram credential, never public)
> and **`KANDAN_UI_KEY`** (`dancan` — the memorable front-door key the user types at
> the board gate). Both are secret bindings, never in this repo, so the gate phrase
> stays out of public source. In the browser the gate asks for the key once per
> session (sessionStorage, cleared on close) and autosave sends it. The chat/Telegram
> CLI reads `KANDAN_KEY` from `/root/.secrets/kandan.env`. Set with:
> `echo "$KEY" | wrangler pages secret put KANDAN_<KEY|UI_KEY> --project-name shakerspace`.
> If neither binding is configured the API fails closed (all writes 403).

`kandan.html` is a functional kanban / notes scratch pad themed as a **corkboard**
with **colorable sticky notes** (drag cards between columns via the ⠿ grip —
pointer-based, works on mouse and touch — pick a sticky color, add per-card
details). Features:

- **Tags:** every card carries one tag; defaults are **#home / #work**, and you
  can add custom tags (e.g. `#homelab`, `#school`) with the **+ Tag** button.
  The **filter** dropdown shows only cards matching a tag (or untagged) across
  all columns — e.g. "show all notes with #homelab".
- **Collapsible columns:** each column (chevron ▲/▼) collapses; the **Done**
  column starts collapsed as an archive. Collapsed state persists.
- **Due times:** a **⏱** button on each card opens a date/time picker; a live
  countdown ("1d 2h left", "30m left", "❗ 3h overdue") shows at the bottom of the
  card and ticks down, flipping amber when <1h and red when overdue. Click the
  countdown chip to clear the due time.
- **Scratch:** a single persistent field below the board; **→ Turn into task**
  converts its contents into a card in the first column (auto-tagging it with the
  active filter if one is set).

Gated by the simple key `danban` (client-side, a fictional gag like the home
console — nothing sensitive lives here). Board state is stored as one JSON doc in
the `KANDAN` KV namespace through `functions/api/kandan.js`; the client keeps a
`localStorage` cache so the pad degrades gracefully if the API is down. Older
board data (a `notes` array, cards without tags/colors/due) auto-migrates on
load. Also reachable from the home console via the `KANDAN` command (gated under
the SYSADMIN login).

### Enabling real file uploads (R2)

1. Create an **R2 bucket** in the Cloudflare dashboard.
2. In the Pages project → **Settings → Bindings**, add an R2 binding named `FILES`
   pointing at that bucket.
3. Uncomment/enable the example handlers at the bottom of
   `functions/api/files/index.js`. That's it — the upload UI + sort already work.

## Local Development

Just open `index.html` in a browser — it's all static, no build step. To test the
Functions/API locally, use Wrangler:

```sh
npx wrangler pages dev .
```

## Security

The site is fully public (public GitHub repo + Cloudflare), so it's hardened by
default. See `_headers` for the applied CSP and security headers. Rules enforced:

- No secrets in the repo — the CLI "login" is a **client-side gag** with a fictional
  credential; never put a real password/token/API key in this repo.
- User-generated content (retro guestbook) is rendered with `textContent`, never
  `innerHTML` — XSS-safe.
- External resources are locked down by CSP `default-src 'self'`.

## Where To Add Stuff

- **New page** → copy `dashboard.html`, drop it in the root, link it from the app
  grid in `index.html`.
- **New API endpoint** → add a file under `functions/api/...` matching the URL.
- **New easter egg** → add an entry to `_eggs` in `main.js` and a card in `eggs.html`.
- **New section on the main page** → add a card to the `.appgrid` in `index.html`.
- **Theme / styling** → everything visual lives in `styles.css` (dark by default, `.light` override).

## Deployment

Cloudflare Pages auto-deploys on push to the connected repo. No build command required.
