// POST   /api/leads          (public)  contact form submission from the website
// GET    /api/leads          (admin)   list submissions
// PATCH  /api/leads?id=…     (admin)   { is_read: true|false }
// DELETE /api/leads?id=…     (admin)   delete a submission
//
// Optional: set FORMSPREE_ID in Vercel to also get an email for every new lead.
import { route, readJson, send, query, fail } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import store from './_lib/db.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (value, max) => String(value ?? '').trim().slice(0, max);

async function forwardToFormspree(lead) {
  const id = process.env.FORMSPREE_ID;
  if (!id) return;
  try {
    await fetch('https://formspree.io/f/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'New lead from your portfolio website',
        ...lead,
        interests: lead.interests.join(', ')
      })
    });
  } catch (error) {
    // The lead is already saved in the database, so a failed email is not fatal
    console.error('Formspree forward failed', error);
  }
}

function leadId(req) {
  const id = Number(query(req).get('id'));
  if (!Number.isInteger(id) || id <= 0) throw fail(400, 'Missing or invalid id.');
  return id;
}

export default route({
  async POST(req, res) {
    const body = await readJson(req, 50 * 1024);

    // Spam trap: real visitors never fill this hidden field
    if (body._gotcha) return send(res, 200, { ok: true });

    const lead = {
      name: text(body.name, 120),
      email: text(body.email, 200),
      company: text(body.company, 160) || null,
      phone: text(body.phone, 60) || null,
      reason: text(body.reason, 80) || null,
      interests: (Array.isArray(body.interests) ? body.interests : [body.interests])
        .filter(Boolean).map((item) => text(item, 60)).slice(0, 12),
      message: text(body.message, 5000),
      reference_link: text(body.reference_link, 500) || null
    };

    if (lead.name.length < 2) throw fail(400, 'Please enter your name.');
    if (!EMAIL.test(lead.email)) throw fail(400, 'Please enter a valid email address.');
    if (lead.message.length < 10) throw fail(400, 'Please write a short message (10+ characters).');

    const id = await store.createLead(lead);
    await forwardToFormspree(lead);
    send(res, 201, { ok: true, id });
  },

  async GET(req, res) {
    if (!requireAdmin(req, res)) return;
    const leads = await store.listLeads();
    send(res, 200, { leads }, { 'Cache-Control': 'no-store' });
  },

  async PATCH(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = leadId(req);
    const body = await readJson(req, 1024);
    await store.updateLead(id, Boolean(body.is_read));
    send(res, 200, { ok: true });
  },

  async DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    await store.deleteLead(leadId(req));
    send(res, 200, { ok: true });
  }
});
