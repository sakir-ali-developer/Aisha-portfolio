// GET /api/account  -> returns the current admin username
// POST /api/account -> changes/updates admin username and/or password
import fs from 'node:fs/promises';
import path from 'node:path';
import { route, readJson, send, fail } from './_lib/http.js';
import { requireAdmin, checkCredentials, hashPassword, createSession, sessionCookie } from './_lib/auth.js';
import store from './_lib/db.js';

async function updateEnvFile(username, password) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let content = await fs.readFile(envPath, 'utf8');
    if (username) {
      if (/^ADMIN_USERNAME=.*/m.test(content)) {
        content = content.replace(/^ADMIN_USERNAME=.*/m, `ADMIN_USERNAME=${username}`);
      } else {
        content += `\nADMIN_USERNAME=${username}`;
      }
    }
    if (password) {
      if (/^ADMIN_PASSWORD=.*/m.test(content)) {
        content = content.replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${password}`);
      } else {
        content += `\nADMIN_PASSWORD=${password}`;
      }
    }
    await fs.writeFile(envPath, content, 'utf8');
  } catch (err) {
    // Read-only filesystem in some deployment containers; ignore
  }
}

export default route({
  async GET(req, res) {
    const session = requireAdmin(req, res);
    if (!session) return;

    let username = session.sub;
    try {
      const creds = await store.getAdminCredentials();
      if (creds?.username) username = creds.username;
    } catch {}

    send(res, 200, { ok: true, user: username }, { 'Cache-Control': 'no-store' });
  },

  async POST(req, res) {
    const session = requireAdmin(req, res);
    if (!session) return;

    const body = await readJson(req, 20 * 1024);
    const currentPassword = String(body.currentPassword || '');
    const newUsername = body.newUsername !== undefined ? String(body.newUsername).trim() : '';
    const newPassword = body.newPassword !== undefined ? String(body.newPassword) : '';

    if (!currentPassword) {
      throw fail(400, 'Current password is required to authorize changes.');
    }

    // Determine current username
    let currentUsername = session.sub;
    try {
      const creds = await store.getAdminCredentials();
      if (creds?.username) currentUsername = creds.username;
    } catch {}

    // Verify current password
    const isCurrentValid = await checkCredentials(currentUsername, currentPassword);
    if (!isCurrentValid) {
      throw fail(400, 'Current password is incorrect.');
    }

    if (!newUsername && !newPassword) {
      throw fail(400, 'Please enter a new username or a new password.');
    }

    let targetUsername = currentUsername;
    if (newUsername) {
      if (newUsername.length < 3) {
        throw fail(400, 'Username must be at least 3 characters.');
      }
      if (newUsername.length > 80) {
        throw fail(400, 'Username must not exceed 80 characters.');
      }
      targetUsername = newUsername;
    }

    let targetPassword = currentPassword;
    if (newPassword) {
      if (newPassword.length < 6) {
        throw fail(400, 'New password must be at least 6 characters.');
      }
      targetPassword = newPassword;
    }

    // Hash the password securely with PBKDF2
    const { hash, salt } = hashPassword(targetPassword);

    // Save to database
    await store.saveAdminCredentials({
      username: targetUsername,
      password_hash: hash,
      salt
    });

    // Update runtime environment variables
    process.env.ADMIN_USERNAME = targetUsername;
    if (newPassword) {
      process.env.ADMIN_PASSWORD = targetPassword;
    }

    // Update local .env file if writable
    await updateEnvFile(targetUsername, newPassword ? targetPassword : null);

    // Refresh the session cookie with the new username
    const newSessionToken = createSession(targetUsername);

    send(res, 200, {
      ok: true,
      user: targetUsername,
      message: 'Credentials updated successfully.'
    }, {
      'Set-Cookie': sessionCookie(newSessionToken, req),
      'Cache-Control': 'no-store'
    });
  }
});
