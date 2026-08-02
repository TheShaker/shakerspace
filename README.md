# dshaker.space

Galaxy-themed personal site, deployed on [Cloudflare Pages](https://pages.cloudflare.com).

**Live site:** [dshaker.space](https://dshaker.space)

## What's Here

| File | What it does |
|---|---|
| `index.html` | Main page — orbital animations, starfield, nebula blobs, section navigation |
| `styles.css` | All styling — galaxy theme with light/dark mode support |
| `main.js` | Client-side interactivity — starfield canvas, theme toggle, section effects |

## Sections

- **Dashboard** — System status cards (placeholder, will connect to API later)
- **Easter Eggs** — Click-to-discover hidden endpoints (currently static, API pending)
- **File Browser** — Upload/download UI (UI only, API pending)
- **Contact** — Ways to reach the mothership

## Local Development

Just open `index.html` in a browser — it's all static files, no build step needed.

## Deployment

Cloudflare Pages auto-deploys on push to the connected repo. No build command required.

## Future Work

- [ ] Connect dashboard cards to live API (Cloudflare Workers)
- [ ] Easter egg endpoints via Workers
- [ ] File hosting via R2 or Workers
- [ ] Nanobot webhook integration
