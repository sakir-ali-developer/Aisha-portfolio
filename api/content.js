// GET /api/content  (public)  -> the website content saved from the dashboard
// PUT /api/content  (admin)   -> save new content
import { route, readJson, send, fail } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import store from './_lib/db.js';

export default route({
  async GET(req, res) {
    const result = await store.getContent();
    send(res, 200, result, {
      // Cached briefly at Vercel's edge; changes show up within about 30 seconds
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300'
    });
  },

  async PUT(req, res) {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req, 2 * 1024 * 1024);
    if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
      throw fail(400, 'Missing content.');
    }
    const updatedAt = await store.saveContent(body.content);
    send(res, 200, { ok: true, updatedAt }, { 'Cache-Control': 'no-store' });
  }
});
