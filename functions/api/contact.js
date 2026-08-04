// Cloudflare Pages Function — contact form handler.
//
// Sends the submitted message as an email via Resend (https://resend.com).
// Requires two secret bindings set in the Cloudflare dashboard
// (Pages project -> Settings -> Bindings -> Environment variables, "Production"):
//   RESEND_API_KEY  = your Resend API key (e.g. re_...)
//   CONTACT_TO      = the email address that receives submissions
//   CONTACT_FROM    = optional sender, default "Shakerspace <onboarding@resend.dev>"
//
// These are secrets — never committed to the repo. Until RESEND_API_KEY /
// CONTACT_TO are set, this returns 503 with a clear message instead of failing
// silently, so you know what to configure.

export async function onRequestPost(context) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: hidden field bots love to fill; humans leave it blank.
  if (body.website && String(body.website).trim().length > 0) {
    return json({ ok: true }); // pretend success, waste the bot's time
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return json({ error: 'Name, email, and message are required.' }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }
  if (!context.env.RESEND_API_KEY || !context.env.CONTACT_TO) {
    return json(
      { error: 'Contact form is not configured yet. Set RESEND_API_KEY and CONTACT_TO bindings in the Cloudflare dashboard.' },
      503
    );
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + context.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: context.env.CONTACT_FROM || 'Shakerspace <onboarding@resend.dev>',
      to: context.env.CONTACT_TO,
      reply_to: email,
      subject: subject ? `[dshaker.space] ${subject}` : '[dshaker.space] New contact message',
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || '—'}\n\n${message}`,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    console.error('Resend send failed:', resp.status, detail);
    return json({ error: 'Failed to send your message. Please try again later.' }, 502);
  }

  return json({ ok: true });
}
