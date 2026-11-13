/* Small helpers shared by every API route.
   Files inside api/_lib are not turned into routes by Vercel (underscore prefix). */

// Reads the raw request body as a Buffer, refusing anything over `limit` bytes
export async function readBody(req, limit = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('Request body is too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req, limit) {
  const body = await readBody(req, limit);
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(data));
}

export function query(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

// Wraps a route so thrown errors become clean JSON responses
export function route(handlers) {
  return async function handler(req, res) {
    const fn = handlers[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return send(res, 405, { error: 'Method not allowed' });
    }
    try {
      await fn(req, res);
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      send(res, status, { error: status === 500 ? 'Server error. Check the Vercel logs.' : error.message });
    }
  };
}

export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
