// POST   /api/upload        (admin)  body = the file, headers: Content-Type, X-File-Name
// DELETE /api/upload?url=…  (admin)  removes a previously uploaded file
import { route, readBody, send, query, fail } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import storage from './_lib/storage.js';

// Vercel accepts request bodies up to 4.5 MB
const MAX_SIZE = 4 * 1024 * 1024;

const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf'
};

function cleanName(raw, ext) {
  const base = String(raw || 'file')
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
  return base + '.' + ext;
}

export default route({
  async POST(req, res) {
    if (!requireAdmin(req, res)) return;

    const type = String(req.headers['content-type'] || '').split(';')[0].trim();
    const ext = ALLOWED[type];
    if (!ext) throw fail(415, 'Only PNG, JPG, WEBP, GIF, SVG or PDF files can be uploaded.');

    const body = await readBody(req, MAX_SIZE);
    if (!body.length) throw fail(400, 'The file is empty.');

    const name = cleanName(decodeURIComponent(req.headers['x-file-name'] || ''), ext);
    const url = await storage.upload(name, body, type);
    send(res, 200, { ok: true, url, size: body.length, type }, { 'Cache-Control': 'no-store' });
  },

  async DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    const url = query(req).get('url');
    if (!url) throw fail(400, 'Missing url.');
    await storage.remove(url);
    send(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
  }
});
