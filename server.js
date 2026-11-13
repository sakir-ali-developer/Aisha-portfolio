/* Local Development & Production Server
   Serves static assets, URL rewrites (/wp-admin -> /admin/index.html),
   and runs all /api/* serverless routes locally.
*/

import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Map of API routes
const apiRoutes = {
  '/api/content': './api/content.js',
  '/api/leads': './api/leads.js',
  '/api/login': './api/login.js',
  '/api/logout': './api/logout.js',
  '/api/session': './api/session.js',
  '/api/upload': './api/upload.js'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // 1. Handle API routes
  for (const [routePath, moduleFile] of Object.entries(apiRoutes)) {
    if (pathname === routePath || pathname.startsWith(routePath + '?')) {
      try {
        const mod = await import(moduleFile);
        const handler = mod.default || mod;
        return await handler(req, res);
      } catch (err) {
        console.error(`[API Error] ${pathname}:`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      }
    }
  }

  // 2. Handle /wp-admin and /admin rewrites
  if (pathname === '/wp-admin' || pathname === '/wp-admin/' || pathname === '/admin' || pathname === '/admin/') {
    pathname = '/admin/index.html';
  }

  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 3. Serve static files
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safeSuffix);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  // 4. 404 Not Found
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(' 🚀 Aisha Portfolio & Dashboard Server Running!');
  console.log('====================================================');
  console.log(` 🌐 Portfolio:  http://localhost:${PORT}`);
  console.log(` 🔐 Dashboard:  http://localhost:${PORT}/wp-admin`);
  console.log('----------------------------------------------------');
  console.log(' 🔑 Dummy Login Credentials:');
  console.log('    Username: admin  (or aisha)');
  console.log('    Password: password123');
  console.log('====================================================');
});
