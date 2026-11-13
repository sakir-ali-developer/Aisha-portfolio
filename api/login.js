// POST /api/login  { username, password }  -> sets the session cookie
import { route, readJson, send, fail } from './_lib/http.js';
import { checkCredentials, createSession, sessionCookie } from './_lib/auth.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default route({
  async POST(req, res) {
    const { username = '', password = '' } = await readJson(req, 10 * 1024);

    if (!await checkCredentials(String(username).trim(), String(password))) {
      // Small delay makes password guessing slower
      await wait(800);
      throw fail(401, 'Wrong username or password.');
    }

    send(res, 200, { ok: true, user: String(username).trim() }, {
      'Set-Cookie': sessionCookie(createSession(String(username).trim()), req),
      'Cache-Control': 'no-store'
    });
  }
});
