/* Database layer.
   - If DATABASE_URL is set: connects to Neon Postgres (production).
   - If DATABASE_URL is not set: automatically uses a local JSON file store (data/db.json)
     so the portfolio & dashboard work 100% out of the box without any setup needed!
*/

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

let client = null;
let schemaReady = null;

function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS site_content (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS leads (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        reason TEXT,
        interests JSONB NOT NULL DEFAULT '[]'::jsonb,
        message TEXT NOT NULL,
        reference_link TEXT,
        is_read BOOLEAN NOT NULL DEFAULT false
      )`;
      await q`CREATE TABLE IF NOT EXISTS admin_credentials (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

const neonStore = {
  async getContent() {
    await ensureSchema();
    const rows = await sql()`SELECT data, updated_at FROM site_content WHERE id = 'main'`;
    return rows[0] ? { content: rows[0].data, updatedAt: rows[0].updated_at } : { content: null, updatedAt: null };
  },

  async saveContent(data) {
    await ensureSchema();
    const json = JSON.stringify(data);
    const rows = await sql()`
      INSERT INTO site_content (id, data, updated_at) VALUES ('main', ${json}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      RETURNING updated_at`;
    await localStore.saveContent(data).catch(() => {});
    return rows[0].updated_at;
  },

  async createLead(lead) {
    await ensureSchema();
    const rows = await sql()`
      INSERT INTO leads (name, email, company, phone, reason, interests, message, reference_link)
      VALUES (${lead.name}, ${lead.email}, ${lead.company}, ${lead.phone}, ${lead.reason},
              ${JSON.stringify(lead.interests)}::jsonb, ${lead.message}, ${lead.reference_link})
      RETURNING id`;
    await localStore.createLead(lead).catch(() => {});
    return rows[0].id;
  },

  async listLeads() {
    await ensureSchema();
    return sql()`SELECT * FROM leads ORDER BY created_at DESC LIMIT 500`;
  },

  async updateLead(id, isRead) {
    await ensureSchema();
    await sql()`UPDATE leads SET is_read = ${isRead} WHERE id = ${id}`;
    await localStore.updateLead(id, isRead).catch(() => {});
  },

  async deleteLead(id) {
    await ensureSchema();
    await sql()`DELETE FROM leads WHERE id = ${id}`;
    await localStore.deleteLead(id).catch(() => {});
  },

  async getAdminCredentials(username) {
    await ensureSchema();
    if (username) {
      const u = String(username).trim();
      const rows = await sql()`SELECT id, username, password_hash, salt, updated_at FROM admin_credentials WHERE LOWER(username) = LOWER(${u}) LIMIT 1`;
      if (rows[0]) return rows[0];
    }
    const adminRow = await sql()`SELECT id, username, password_hash, salt, updated_at FROM admin_credentials WHERE id = 'admin'`;
    if (adminRow[0]) return adminRow[0];
    const anyRows = await sql()`SELECT id, username, password_hash, salt, updated_at FROM admin_credentials ORDER BY updated_at DESC LIMIT 1`;
    return anyRows[0] || null;
  },

  async saveAdminCredentials({ username, password_hash, salt }) {
    await ensureSchema();
    const rows = await sql()`
      INSERT INTO admin_credentials (id, username, password_hash, salt, updated_at)
      VALUES ('admin', ${username}, ${password_hash}, ${salt}, now())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        updated_at = now()
      RETURNING updated_at`;
    
    // Also record by username key
    await sql()`
      INSERT INTO admin_credentials (id, username, password_hash, salt, updated_at)
      VALUES (${username.toLowerCase()}, ${username}, ${password_hash}, ${salt}, now())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        updated_at = now()
    `.catch(() => {});

    await localStore.saveAdminCredentials({ username, password_hash, salt }).catch(() => {});
    return rows[0]?.updated_at;
  }
};

/* --------------------------------------------------------------------------
   Local & In-Memory Store (Active whenever DATABASE_URL is not set)
   -------------------------------------------------------------------------- */
const dataDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'db.json');

// In-memory cache
let memDb = { content: null, updatedAt: null, leads: [] };
let memLoaded = false;

async function loadLocalDb() {
  if (memLoaded) return memDb;
  try {
    const raw = await fs.readFile(dbFile, 'utf8');
    memDb = JSON.parse(raw);
  } catch {
    memDb = { content: null, updatedAt: null, leads: [] };
  }
  memLoaded = true;
  return memDb;
}

async function persistLocalDb() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dbFile, JSON.stringify(memDb, null, 2), 'utf8');
  } catch (err) {
    // If running in a read-only container, memDb will still persist in memory
    console.warn('[LocalStore] Notice: persisting to disk failed, using in-memory state:', err.message);
  }
}

const localStore = {
  async getContent() {
    await loadLocalDb();
    return { content: memDb.content, updatedAt: memDb.updatedAt };
  },

  async saveContent(data) {
    await loadLocalDb();
    const now = new Date().toISOString();
    memDb.content = data;
    memDb.updatedAt = now;
    await persistLocalDb();
    return now;
  },

  async createLead(lead) {
    await loadLocalDb();
    const newId = Date.now();
    const item = {
      id: newId,
      created_at: new Date().toISOString(),
      name: lead.name,
      email: lead.email,
      company: lead.company || null,
      phone: lead.phone || null,
      reason: lead.reason || null,
      interests: lead.interests || [],
      message: lead.message,
      reference_link: lead.reference_link || null,
      is_read: false
    };
    memDb.leads = memDb.leads || [];
    memDb.leads.unshift(item);
    await persistLocalDb();
    return newId;
  },

  async listLeads() {
    await loadLocalDb();
    return memDb.leads || [];
  },

  async updateLead(id, isRead) {
    await loadLocalDb();
    const lead = (memDb.leads || []).find((l) => String(l.id) === String(id));
    if (lead) {
      lead.is_read = isRead;
      await persistLocalDb();
    }
  },

  async deleteLead(id) {
    await loadLocalDb();
    memDb.leads = (memDb.leads || []).filter((l) => String(l.id) !== String(id));
    await persistLocalDb();
  },

  async getAdminCredentials(username) {
    await loadLocalDb();
    if (username && memDb.admin_credentials && memDb.admin_credentials.username.toLowerCase() === username.trim().toLowerCase()) {
      return memDb.admin_credentials;
    }
    return memDb.admin_credentials || null;
  },

  async saveAdminCredentials({ username, password_hash, salt }) {
    await loadLocalDb();
    const now = new Date().toISOString();
    memDb.admin_credentials = { username, password_hash, salt, updated_at: now };
    await persistLocalDb();
    return now;
  }
};

const store = process.env.DATABASE_URL
  ? neonStore
  : (process.env.PORTFOLIO_DEV_DB ? (await import(process.env.PORTFOLIO_DEV_DB)).default : localStore);

export default store;
