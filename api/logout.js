// POST /api/logout  -> clears the session cookie
import { route, send } from './_lib/http.js';
import { clearCookie } from './_lib/auth.js';

export default route({
  async POST(req, res) {
    send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(req), 'Cache-Control': 'no-store' });
  }
});
