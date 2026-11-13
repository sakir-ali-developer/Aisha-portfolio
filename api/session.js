// GET /api/session  -> tells the dashboard whether you are logged in
import { route, send } from './_lib/http.js';
import { getSession } from './_lib/auth.js';

export default route({
  async GET(req, res) {
    const session = getSession(req);
    send(res, session ? 200 : 401, session ? { ok: true, user: session.sub } : { ok: false }, {
      'Cache-Control': 'no-store'
    });
  }
});
