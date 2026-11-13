/* ==============================================================================
   Database Seeding Script (seed.db.js)
   - Connects to Neon PostgreSQL via DATABASE_URL
   - Creates the necessary schema (site_content & leads tables)
   - Seeds site content from data/db.json into Neon
   - Seeds realistic dummy leads for testing the admin inbox
   - Synchronizes local fallback (data/db.json)
============================================================================== */

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbJsonPath = path.join(__dirname, 'data', 'db.json');

const DUMMY_LEADS = [
  {
    name: "Marcus Vance",
    email: "marcus.vance@vancetech.io",
    company: "Vance Technologies",
    phone: "+1 (555) 234-5678",
    reason: "Project Coordination",
    interests: ["GoHighLevel CRM", "Automation & Integrations", "Project Scoping"],
    message: "Hi Aisha, we have an upcoming enterprise migration to GoHighLevel with custom Make.com webhooks and Zapier workflows. We need a technical project manager to lead delivery and coordinate our 4 engineers. Looking forward to discussing your timeline and availability!",
    reference_link: "https://vancetech.io",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    name: "Sophia Martinez",
    email: "sophia@luminaagency.co",
    company: "Lumina Digital Agency",
    phone: "+44 20 7946 0912",
    reason: "Technical Consulting",
    interests: ["WordPress & CMS", "Sprint Planning", "Quality Assurance"],
    message: "Hello Aisha! We love your portfolio. We are redesigning 3 WordPress client sites with custom ACF and WooCommerce integrations and need someone experienced in bridging client requirements and technical developers. Are you available for a 3-month contract?",
    reference_link: "https://luminaagency.co",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    name: "Alexander Wright",
    email: "a.wright@cloudpulse.app",
    company: "CloudPulse SaaS",
    phone: "+1 (415) 890-1234",
    reason: "Full Delivery Management",
    interests: ["SaaS Delivery", "Workflow Automation", "Sprint Planning"],
    message: "Hi Aisha, our team is building an internal ops dashboard connecting HubSpot, Stripe, and PostgreSQL. We need a PM who understands technical architecture and can keep sprints on track. Let's schedule a call this week.",
    reference_link: "https://cloudpulse.app",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    name: "Fatima Al-Mansoor",
    email: "falmansoor@horizonbrands.ae",
    company: "Horizon Brands Dubai",
    phone: "+971 50 123 4567",
    reason: "Platform Migration",
    interests: ["GoHighLevel CRM", "E-Commerce", "Client Communication"],
    message: "Greetings Aisha, we are launching an omnichannel campaign across the GCC and require CRM automation and landing funnel delivery within 6 weeks. Your technical PM background in Dubai/remote looks like a great fit.",
    reference_link: "https://horizonbrands.ae",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    name: "Daniel Kim",
    email: "dkim@hypergrowth.vc",
    company: "HyperGrowth Studio",
    phone: "+1 (650) 432-8765",
    reason: "Retainer / Ongoing PM",
    interests: ["Make.com / n8n", "Sprint Planning", "Quality Assurance"],
    message: "Hey Aisha, we run an accelerator studio building multiple MVPs simultaneously. We are looking for an organized Technical PM to oversee backlog grooming, client demos, and developer handoffs across 2 portfolio startups.",
    reference_link: "https://hypergrowth.vc",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
  }
];

async function loadBaseContent() {
  try {
    const raw = await fs.readFile(dbJsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.content;
  } catch (err) {
    console.warn('[Seed] Notice: Could not read data/db.json, using fallback content:', err.message);
    return null;
  }
}

async function seedDatabase() {
  console.log('====================================================');
  console.log(' 🌱 Starting Database Seeding (seed.db)...');
  console.log('====================================================');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env file!');
    process.exit(1);
  }

  console.log(`🔗 Connecting to Neon Database...`);
  const sql = neon(databaseUrl);

  try {
    // 1. Ensure Schema
    console.log('📋 Creating / Verifying database tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS site_content (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leads (
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
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log('✔ Tables "site_content", "leads", and "admin_credentials" verified.');

    // 2. Seed Admin Credentials
    const crypto = await import('node:crypto');
    const defaultUser = process.env.ADMIN_USERNAME || 'aisha_muhammad_ali_@7623';
    const defaultPass = process.env.ADMIN_PASSWORD || 'aisha_MUHAMMAD@#!Ali';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(defaultPass, salt, 100000, 64, 'sha512').toString('hex');

    console.log(`🔐 Seeding admin credentials for '${defaultUser}'...`);
    await sql`
      INSERT INTO admin_credentials (id, username, password_hash, salt, updated_at)
      VALUES ('admin', ${defaultUser}, ${hash}, ${salt}, now())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        updated_at = now()
    `;
    console.log('✔ Admin credentials seeded successfully into Neon DB!');

    // Also update data/db.json
    try {
      const raw = await fs.readFile(dbJsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      parsed.admin_credentials = {
        username: defaultUser,
        password_hash: hash,
        salt,
        updated_at: new Date().toISOString()
      };
      await fs.writeFile(dbJsonPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log('✔ Admin credentials synchronized to data/db.json!');
    } catch (e) {
      console.warn('Notice: could not sync data/db.json:', e.message);
    }

    // 2. Seed Site Content
    const content = await loadBaseContent();
    if (content) {
      console.log('📝 Seeding site content into "site_content" table...');
      const json = JSON.stringify(content);
      await sql`
        INSERT INTO site_content (id, data, updated_at)
        VALUES ('main', ${json}::jsonb, now())
        ON CONFLICT (id) DO UPDATE
        SET data = EXCLUDED.data, updated_at = now()
      `;
      console.log('✔ Portfolio site content successfully seeded!');
    }

    // 3. Seed Leads
    console.log(`📬 Seeding ${DUMMY_LEADS.length} dummy leads into "leads" table...`);
    for (const lead of DUMMY_LEADS) {
      await sql`
        INSERT INTO leads (name, email, company, phone, reason, interests, message, reference_link, is_read, created_at)
        VALUES (
          ${lead.name},
          ${lead.email},
          ${lead.company},
          ${lead.phone},
          ${lead.reason},
          ${JSON.stringify(lead.interests)}::jsonb,
          ${lead.message},
          ${lead.reference_link},
          ${lead.is_read},
          ${lead.created_at}::timestamptz
        )
      `;
    }
    console.log(`✔ Successfully inserted ${DUMMY_LEADS.length} dummy leads!`);

    // 4. Verification Check
    const contentRows = await sql`SELECT id, updated_at FROM site_content WHERE id = 'main'`;
    const leadCountRows = await sql`SELECT COUNT(*)::int as count FROM leads`;
    const latestLeads = await sql`SELECT id, name, company, is_read, created_at FROM leads ORDER BY created_at DESC LIMIT 5`;

    console.log('----------------------------------------------------');
    console.log('📊 Verification Report:');
    console.log(`   - Site Content Record : ID '${contentRows[0]?.id}', Updated: ${contentRows[0]?.updated_at}`);
    console.log(`   - Total Leads in DB   : ${leadCountRows[0]?.count}`);
    console.log('   - Latest Leads:');
    latestLeads.forEach(l => {
      console.log(`     * [#${l.id}] ${l.name} (${l.company || 'N/A'}) - Read: ${l.is_read}`);
    });

    // 5. Sync local data/db.json
    try {
      const existingRaw = await fs.readFile(dbJsonPath, 'utf8').catch(() => null);
      let localData = existingRaw ? JSON.parse(existingRaw) : { content: content || {}, leads: [] };
      localData.leads = DUMMY_LEADS.map((l, idx) => ({ ...l, id: idx + 1 }));
      localData.updatedAt = new Date().toISOString();
      await fs.writeFile(dbJsonPath, JSON.stringify(localData, null, 2), 'utf8');
      console.log('✔ Local data/db.json synchronized.');
    } catch (syncErr) {
      console.warn('Notice: Local db.json sync skipped:', syncErr.message);
    }

    console.log('====================================================');
    console.log(' 🎉 Seeding Completed Successfully!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

seedDatabase();
