// Cloudflare Pages Function — hosted file list API.
//
// Real uploads/downloads need an R2 bucket. To enable them:
//   1. Create an R2 bucket in the Cloudflare dashboard.
//   2. In the Pages project -> Settings -> Bindings, add an R2 binding
//      named `FILES` pointing at that bucket.
//   3. This endpoint then lists/lets you upload/download from it.
// Until then it returns an empty list with a note, so the UI stays honest.
export function onRequestGet() {
  const body = {
    files: [],
    note: 'File storage is not configured yet. Add an R2 bucket and bind it to this Pages project as FILES, and uploads will work here.',
  };
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

// Example once an R2 `FILES` binding exists:
//
// export async function onRequestGet(context) {
//   const list = await context.env.FILES.list();
//   const files = list.objects.map((o) => ({
//     name: o.key,
//     size: o.size,
//     url: '/api/files/' + encodeURIComponent(o.key),
//   }));
//   return Response.json({ files });
// }
//
// export async function onRequestPost(context) {
//   const form = await context.request.formData();
//   const file = form.get('file');
//   if (!file) return new Response('missing file', { status: 400 });
//   await context.env.FILES.put(file.name, file.stream(), { httpMetadata: { contentType: file.type } });
//   return Response.json({ ok: true });
// }
