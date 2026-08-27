// Cloudflare Pages Function — KANDAN board persistence.
// Stores the whole board (columns + cards + notes) as one JSON doc in KV.
// Binding: KANDAN  ->  KV namespace "kandan"  (see wrangler.toml).
// Client keeps a localStorage cache so the pad still degrades gracefully offline.

const KEY = 'kandan_board';

export async function onRequestGet(context) {
  const ns = context.env.KANDAN;
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
