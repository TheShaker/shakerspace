// Cloudflare Pages Function — live system dashboard API.
// Self-contained: needs no bindings, so it works on the Free plan as-is.
// Returns the exact shape the dashboard (dashboard.html -> refreshDash in main.js) expects.
export function onRequestGet() {
  const data = {
    status: 'Operational',
    message: 'All systems nominal — pure Cloudflare Pages, no separate backend.',
    uptime: '∞',
    hostname: 'dshaker.space (Cloudflare Pages)',
    python: '—',
    platform: 'static',
    served: 'edge',
    generated: new Date().toISOString(),
  };
  return Response.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
