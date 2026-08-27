// Cloudflare Pages Function — KANDAN board persistence.
// Stores the whole board (columns + cards + notes) as one JSON doc in KV.
// Binding: KANDAN  ->  KV namespace "kandan"  (see wrangler.toml).
// Client keeps a localStorage cache so the pad still degrades gracefully offline.

const KEY = 'kandan_board';

// Timing-safe-ish string compare for the write key.
function keysEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// The write key may come from the query string (?key=...) or the X-Kandan-Key
// header. Two keys are accepted:
//   - KANDAN_KEY   (secure random) — the agent/CLI/Telegram credential, never public.
//   - KANDAN_UI_KEY ("dancan")     — the memorable front-door key the user types
//                                     at the board gate. Stored as a secret binding,
//                                     NOT in this repo, so it stays out of public source.
// GET stays public (the board is a non-sensitive scratch pad); POST 403s without a
// valid key of either kind.
function authorized(context) {
  const k = context.env.KANDAN_KEY;
  const ui = context.env.KANDAN_UI_KEY;
  if (!k && !ui) return false;               // no secret configured -> fail closed
  const url = new URL(context.request.url);
  const fromQuery = url.searchParams.get('key');
  const fromHeader = context.request.headers.get('X-Kandan-Key');
  const given = fromQuery || fromHeader || '';
  if (!given) return false;
  if (k && keysEqual(given, k)) return true;
  if (ui && keysEqual(given, ui)) return true;
  return false;
}

export async function onRequestGet(context) {
  const ns = context.env.KANDAN;

  // Key-verification probe: /api/kandan?verify=1 with X-Kandan-Key header
  // lets the page gate confirm a typed key before unlocking editing. No KV touched.
  const url = new URL(context.request.url);
  if (url.searchParams.get('verify')) {
    return Response.json({ authorized: authorized(context) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (!ns) {
    return Response.json({ columns: [], notes: [], note: 'KANDAN binding not configured.' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  let board = null;
  try {
    const raw = await ns.get(KEY);
    board = raw ? JSON.parse(raw) : null;
  } catch (e) {
    board = null;
  }
  const resp = board || { columns: [], notes: [] };
  return Response.json(resp, { headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestPost(context) {
  if (!authorized(context)) {
    return Response.json({ error: 'Unauthorized — a valid write key is required.' }, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const ns = context.env.KANDAN;
  if (!ns) {
    return Response.json({ error: 'KANDAN binding not configured.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  let body;
  try { body = await context.request.json(); } catch (e) {
    return Response.json({ error: 'Invalid JSON body.' }, {
      status: 400, headers: { 'Cache-Control': 'no-store' },
    });
  }
  // Light validation: must be an object with a columns array.
  if (!body || typeof body !== 'object' || !Array.isArray(body.columns)) {
    return Response.json({ error: 'Expected { columns: [...], notes: [...] }.' }, {
      status: 400, headers: { 'Cache-Control': 'no-store' },
    });
  }
  await ns.put(KEY, JSON.stringify(body));
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
