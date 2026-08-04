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
| `retro.html` | The Retro Zone — Win95 + Geocities nostalgia page |
| `404.html` | Themed lost-in-space 404 |
| `styles.css` | All styling — galaxy theme, light/dark mode |
| `main.js` | Client-side interactivity — starfield, theme, CLI, files, dashboard |
| `_headers` | Security headers applied by Cloudflare Pages (CSP, nosniff, etc.) |
| `functions/` | Cloudflare Pages Functions — the backend API |

## The API (`functions/`)

Pages Functions are auto-deployed by Cloudflare on push (no build step). They live
at `functions/` and map 1:1 to URL paths.

| Route | File | Status |
|---|---|---|
| `GET /api/services/status` | `functions/api/services/status.js` | ✅ Live — powers the dashboard |
| `GET /api/files` | `functions/api/files/index.js` | ✅ Live (empty list) — see below to enable uploads |

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
