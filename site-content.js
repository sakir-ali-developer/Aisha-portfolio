/* ==========================================================================
   Aisha Ali Muhammad | Portfolio
   site-content.js

   Loads the content you edit in the dashboard (/wp-admin) from
   /api/content and writes it into the page.

   - DEFAULTS below is the starting content (same as the static HTML).
   - If the database has no saved content yet, or the request fails,
     the page simply keeps its built-in HTML.
   - Text can use these placeholders, which are replaced everywhere:
       {{experience}}  {{teamSize}}  {{location}}  {{email}}
   - In titles, wrap a word in [square brackets] to highlight it.

   The dashboard loads this same file to get DEFAULTS and the icon lists.
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Default content
     ------------------------------------------------------------------------ */
  const DEFAULTS = {
    settings: {
      experience: '3',
      teamSize: '3–5',
      location: 'Your City, Country',
      status: 'Open to new opportunities',
      email: 'aishaalimuhammad837@gmail.com',
      phone: '',
      heroImage: 'Aisha.png',
      heroImageAlt: 'Aisha Ali Muhammad, Technical Project Manager',
      cv: 'Aisha-Ali-Muhammad-CV.pdf'
    },

    socials: [
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/aisha-ali-muhammad-b038b6402/' }
    ],

    hero: {
      hello: 'Hi, I’m Aisha Ali Muhammad',
      role: 'Technical Project Manager',
      titleLines: ['Turning client', 'requirements into', '[delivered] projects.'],
      text: 'I bridge clients and developers across GoHighLevel, WordPress, automation and digital platforms, from the first requirement to final handover.',
      button: 'Start a conversation',
      facts: [
        { icon: 'briefcase', text: '{{experience}} years experience' },
        { icon: 'users', text: 'Teams of {{teamSize}}' },
        { icon: 'pin', text: '{{location}}' }
      ],
      badgeText: 'TECHNICAL PROJECT MANAGER / DIGITAL DELIVERY /',
      flowFrom: 'Requirements',
      flowTo: 'Delivery'
    },

    ticker: [
      { bold: '{{experience}} Years', text: 'Experience' },
      { bold: '{{teamSize}}', text: 'Member Teams' },
      { bold: '7', text: 'Project Categories' },
      { bold: 'Requirements', text: 'to Delivery' }
    ],

    about: {
      eyebrow: 'About me',
      title: 'I connect business goals with technical execution.',
      statement: 'I’m a Technical Project Manager with {{experience}} years of experience coordinating digital projects, managing client relationships and guiding development teams. My role isn’t to write the code. It’s to understand it well enough to make informed decisions, set clear expectations and deliver the right solution.',
      paragraphs: [
        'My work spans GoHighLevel CRM systems, WordPress websites, marketing automation, SaaS and AI-related platforms, online course platforms and e-commerce projects.',
        'I turn client conversations into clear tasks, help developers move without guesswork, and check every deliverable against what was agreed.'
      ],
      linkText: 'Let’s talk about your project or role',
      stats: [
        { value: '{{experience}}', label: 'Years of experience' },
        { value: '{{teamSize}}', label: 'Team size I coordinate' },
        { value: '7', label: 'Project categories' }
      ],
      toolsRow1: ['GoHighLevel', 'WordPress', 'Elementor', 'Make.com', 'n8n', 'Zapier'],
      toolsRow2: ['Slack', 'ClickUp', 'Airtable', 'Microsoft Office', 'Webhooks', 'GoDaddy']
    },

    services: {
      eyebrow: 'What I do',
      title: 'From the first call to final handover.',
      lead: 'Five things I take care of on every project, so clients feel heard and developers know exactly what to build.',
      items: [
        { title: 'Client Communication & Requirements', text: 'I work directly with clients to understand their goals, gather requirements, clarify expectations and turn discussions into actionable development tasks.', points: ['Discovery calls & meetings', 'Requirement documentation', 'Expectation management'] },
        { title: 'Technical Project Coordination', text: 'I evaluate implementation options, discuss alternative approaches and work with developers to agree on the most suitable solution.', points: ['Feasibility checks', 'Dependency mapping', 'Alternative solutions'] },
        { title: 'Development Team Management', text: 'Structured task descriptions, requirements shared on Slack, quick answers to questions, managed dependencies and steady follow-ups.', points: ['Clear task briefs', 'Blocker resolution', 'Regular follow-ups'] },
        { title: 'Project Tracking & Delivery', text: 'Tasks, timelines and progress tracked in ClickUp and Airtable, with client timesheets maintained and deliverables coordinated.', points: ['ClickUp & Airtable tracking', 'Client timesheets', 'Progress updates'] },
        { title: 'Quality & Requirement Validation', text: 'I review completed work against the agreed requirements, flag discrepancies and coordinate revisions before anything reaches the client.', points: ['Requirement checks', 'Revision tracking', 'Final handover'] }
      ]
    },

    expertise: {
      eyebrow: 'Expertise',
      title: 'Project management, backed by technical understanding.',
      tabs: [
        { name: 'GoHighLevel', icon: 'funnel', intro: 'CRM systems, funnels and automations for client-specific business processes.', items: ['CRM configuration & pipelines', 'Workflow automation & triggers', 'Calendars & appointment booking', 'Forms, surveys & lead capture', 'Funnels & landing pages', 'Chatbots & Voice AI', 'Webhooks & third-party integrations'] },
        { name: 'WordPress', icon: 'globe', intro: 'Website structure, configuration and technical coordination.', items: ['Website structure & functionality', 'Elementor & Elementor Pro', 'Theme & plugin configuration', 'Domains, hosting & GoDaddy', 'Database & architecture fundamentals', 'HTML & CSS concepts', 'Troubleshooting'] },
        { name: 'Automation', icon: 'flow', intro: 'Connecting platforms and planning workflows that actually run.', items: ['Make.com', 'n8n', 'Zapier', 'Webhooks & data flow', 'CRM integrations', 'Feasibility & process planning'] },
        { name: 'PM Tools', icon: 'briefcase', intro: 'The tools I use to keep teams aligned and projects on track.', items: ['Slack: client & developer communication', 'ClickUp: tasks, deadlines & progress', 'Airtable: project & operational tracking', 'Microsoft Office: documentation & reporting', 'Client timesheets'] }
      ]
    },

    work: {
      eyebrow: 'Selected work',
      title: 'Projects I’ve helped deliver.',
      lead: 'The kinds of projects I coordinate, and my role on each.',
      note: 'I’ve also coordinated work on other digital platforms and business tools, and I’m happy to walk through any project in detail.',
      projects: [
        { title: 'GoHighLevel CRM & Automation System', tags: ['GoHighLevel', 'CRM', 'Automation'], text: 'CRM setup, pipelines, workflow automation, lead capture, appointment booking and funnels built around client-specific processes.', role: 'Requirement gathering, technical coordination, task management and delivery tracking.', link: '', image: '', accent: '#8a5cc7' },
        { title: 'WordPress Business Website', tags: ['WordPress', 'Elementor', 'Website'], text: 'A WordPress and Elementor website covering configuration, domain and hosting coordination and custom front-end requirements.', role: 'Client communication, scope clarification, development planning and requirement validation.', link: '', image: '', accent: '#b07ae8' },
        { title: 'Cross-Platform Workflow Automation', tags: ['Make.com', 'n8n', 'Zapier'], text: 'Workflows built with Make.com, n8n, Zapier and webhooks to connect CRMs, forms and business tools.', role: 'Process mapping, feasibility discussions and integration requirement documentation.', link: '', image: '', accent: '#6f8cf0' },
        { title: 'SaaS & AI Platform', tags: ['SaaS', 'AI', 'Product'], text: 'A digital product involving SaaS functionality and AI-related features, from requirements through to delivery.', role: 'Clarifying functionality, coordinating development tasks and managing client expectations.', link: '', image: '', accent: '#d07ad6' },
        { title: 'Online Course Platform', tags: ['Online Courses', 'Platform'], text: 'A platform for publishing and delivering online courses, built around the client’s learning content.', role: 'Understanding business needs, defining scope and coordinating development.', link: '', image: '', accent: '#e9a85c' },
        { title: 'E-commerce Website', tags: ['E-commerce', 'Online Store'], text: 'An online store project, coordinated from requirement gathering to launch.', role: 'Requirement gathering, developer coordination and pre-launch review.', link: '', image: '', accent: '#ec6f9a' }
      ]
    },

    process: {
      eyebrow: 'My process',
      title: 'A clear path from requirements to delivery.',
      lead: 'Six steps keep every project organised, transparent and moving forward.',
      steps: [
        { icon: 'search', title: 'Discover', text: 'Understand the client’s objectives, requirements, priorities and expected outcomes.' },
        { icon: 'chart', title: 'Analyze', text: 'Review technical requirements, identify dependencies, assess feasibility and discuss approaches.' },
        { icon: 'layers', title: 'Plan', text: 'Break requirements into clear tasks, set priorities and document acceptance criteria.' },
        { icon: 'sync', title: 'Coordinate', text: 'Brief developers, clarify requirements, resolve blockers and keep stakeholders updated.' },
        { icon: 'circle-check', title: 'Review', text: 'Validate completed work against requirements, collect feedback and coordinate revisions.' },
        { icon: 'package', title: 'Deliver', text: 'Coordinate final delivery, confirm open items and keep documentation and timesheets up to date.' }
      ]
    },

    why: {
      eyebrow: 'Why work with me',
      title: 'What you can expect.',
      cards: [
        { icon: 'chip', title: 'Technically informed decisions', text: 'I understand the platforms behind the projects I manage.' },
        { icon: 'chat', title: 'Clear communication', text: 'Client discussions become structured, understandable tasks.' },
        { icon: 'sync', title: 'Solution-oriented thinking', text: 'When the first approach won’t work, I find practical alternatives.' },
        { icon: 'tasks', title: 'Organized execution', text: 'Tasks, documentation, timelines and updates stay in order.' },
        { icon: 'shield', title: 'Client-focused delivery', text: 'Agreed requirements and business goals stay at the centre.' }
      ]
    },

    band: { text: 'Let’s work together' },

    contact: {
      eyebrow: 'Contact',
      title: 'Let’s start the conversation.',
      lead: 'Hiring for a technical project manager role, or need someone to organise a digital project? Share a few details and I’ll get back to you.',
      formTitle: 'Tell me about it'
    },

    cta: {
      line1: 'Clear requirements.',
      line2: 'Organised delivery.',
      button: 'Start a conversation'
    },

    footer: {
      tagline: 'Technical Project Manager | GoHighLevel, WordPress, Automation & Digital Solutions'
    }
  };


  /* 2. Icons
     SITE_ICONS: line icons from the page's SVG sprite (used in boxes, tabs, steps).
     SOCIALS: platforms you can pick for social links. Brand icons come from the
     Simple Icons library on jsDelivr; the rest use the page's own sprite.
     ------------------------------------------------------------------------ */
  const SITE_ICONS = [
    'chat', 'sync', 'users', 'tasks', 'shield', 'search', 'chart', 'layers', 'circle-check',
    'package', 'funnel', 'globe', 'flow', 'chip', 'book', 'cart', 'briefcase', 'mail',
    'phone', 'pin', 'clock', 'grid', 'spark', 'check', 'send', 'link'
  ];

  const SIMPLE_ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@11.0.0/icons/';

  const SOCIALS = {
    linkedin:  { label: 'LinkedIn',  sprite: 'linkedin' },
    email:     { label: 'Email',     sprite: 'mail' },
    phone:     { label: 'Phone',     sprite: 'phone' },
    website:   { label: 'Website',   sprite: 'globe' },
    whatsapp:  { label: 'WhatsApp',  brand: 'whatsapp' },
    github:    { label: 'GitHub',    brand: 'github' },
    x:         { label: 'X',         brand: 'x' },
    facebook:  { label: 'Facebook',  brand: 'facebook' },
    instagram: { label: 'Instagram', brand: 'instagram' },
    youtube:   { label: 'YouTube',   brand: 'youtube' },
    behance:   { label: 'Behance',   brand: 'behance' },
    dribbble:  { label: 'Dribbble',  brand: 'dribbble' },
    upwork:    { label: 'Upwork',    brand: 'upwork' },
    fiverr:    { label: 'Fiverr',    brand: 'fiverr' },
    other:     { label: 'Other link', sprite: 'link' }
  };


  /* 3. Helpers
     ------------------------------------------------------------------------ */
  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

  // Saved content on top of the defaults (arrays are replaced, objects merged)
  function merge(base, extra) {
    if (!isObject(extra)) return base;
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(extra).forEach(function (key) {
      out[key] = isObject(base[key]) && isObject(extra[key]) ? merge(base[key], extra[key]) : extra[key];
    });
    return out;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function makeFill(settings) {
    const vars = {
      experience: settings.experience,
      teamSize: settings.teamSize,
      location: settings.location,
      email: settings.email
    };
    return function fill(text) {
      return String(text == null ? '' : text).replace(/\{\{\s*(\w+)\s*\}\}/g, function (match, key) {
        return key in vars ? vars[key] : match;
      });
    };
  }

  function icon(name, extra) {
    return '<svg class="icon' + (extra ? ' ' + extra : '') + '"><use href="#icon-' + esc(name) + '"></use></svg>';
  }

  function socialIcon(platform) {
    const info = SOCIALS[platform] || SOCIALS.other;
    if (info.sprite) return icon(info.sprite);
    return '<span class="sicon" style="--sicon:url(' + SIMPLE_ICONS + info.brand + '.svg)" aria-hidden="true"></span>';
  }

  function safeUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(value) || !/^[a-z]+:/i.test(value)) return value;
    return ''; // blocks javascript: and other unsafe links
  }

  function socialHref(item) {
    const url = String(item.url || '').trim();
    if (item.platform === 'email' && url && !/^mailto:/i.test(url)) return 'mailto:' + url;
    if (item.platform === 'phone' && url && !/^tel:/i.test(url)) return 'tel:' + url.replace(/[^\d+]/g, '');
    if (item.platform === 'whatsapp' && /^\+?[\d\s-]+$/.test(url)) return 'https://wa.me/' + url.replace(/\D/g, '');
    return safeUrl(url);
  }

  const isExternal = (href) => /^https?:/i.test(href);
  const telHref = (phone) => 'tel:' + String(phone).replace(/[^\d+]/g, '');


  /* 4. Apply content to the page
     ------------------------------------------------------------------------ */
  function apply(content) {
    const c = merge(DEFAULTS, content);
    const s = c.settings;
    const fill = makeFill(s);
    const t = (text) => esc(fill(text));                       // plain text
    const h = (text) => t(text).replace(/\[([^\]]+)\]/g, '<em>$1</em>'); // [word] highlight
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
    const setText = (sel, text) => { const el = $(sel); if (el) el.textContent = fill(text); };
    const setHTML = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

    const socials = (c.socials || []).filter((item) => socialHref(item));
    const cvHref = safeUrl(s.cv);

    // --- CV links everywhere ---
    $$('a[download]').forEach(function (link) {
      if (!cvHref) { link.remove(); return; }
      link.setAttribute('href', cvHref);
      if (isExternal(cvHref)) link.setAttribute('target', '_blank');
    });

    // --- Menu ---
    const mail = $('.menu__mail');
    if (mail) { mail.href = 'mailto:' + s.email; mail.textContent = s.email; }
    const menuLines = $$('.menu__line');
    if (menuLines[0]) {
      if (s.phone) { menuLines[0].href = telHref(s.phone); menuLines[0].textContent = s.phone; }
      else menuLines[0].remove();
    }
    if (menuLines[1]) {
      if (s.location) menuLines[1].textContent = s.location; else menuLines[1].remove();
    }
    $$('.badge--status').forEach(function (badge) {
      badge.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + t(s.status);
    });
    setHTML('.menu__social', socials.map(function (item) {
      const href = socialHref(item);
      return '<a href="' + esc(href) + '"' + (isExternal(href) ? ' target="_blank" rel="noopener"' : '') + '>' + t(item.label || (SOCIALS[item.platform] || SOCIALS.other).label) + '</a>';
    }).join('') + (cvHref ? '<a href="' + esc(cvHref) + '" download="Aisha-Ali-Muhammad-CV.pdf"' + (isExternal(cvHref) ? ' target="_blank"' : '') + '>Download CV</a>' : ''));

    // --- Hero ---
    setHTML('.hero__hello', '<span class="hero__hello-line" aria-hidden="true"></span>' + t(c.hero.hello));
    setHTML('.hero__title',
      '<span class="hero__role" data-animate>' + t(c.hero.role) + '</span>' +
      (c.hero.titleLines || []).map((line) => '<span class="line"><span>' + h(line) + '</span></span>').join(''));
    setText('.hero__text', c.hero.text);
    const heroBtn = $('.hero__actions .btn--primary');
    if (heroBtn) heroBtn.innerHTML = t(c.hero.button) + icon('arrow');
    setHTML('.hero__facts', (c.hero.facts || [])
      .filter((fact) => fill(fact.text).trim())
      .map((fact) => '<li>' + icon(fact.icon || 'check') + t(fact.text) + '</li>').join(''));

    const photo = $('.hero__photo');
    if (photo) {
      if (s.heroImage) {
        photo.src = s.heroImage;
        photo.alt = fill(s.heroImageAlt || 'Aisha Ali Muhammad');
        photo.hidden = false;
      } else {
        photo.hidden = true;
      }
    }
    const badgePath = $('.spin-badge textPath');
    if (badgePath) badgePath.textContent = fill(c.hero.badgeText);
    setHTML('.float-card--status', '<span class="status-dot" aria-hidden="true"></span>' + t(s.status));
    setHTML('.float-card--flow', '<span>' + t(c.hero.flowFrom) + '</span>' + icon('arrow-right') + '<span>' + t(c.hero.flowTo) + '</span>');

    // --- Ticker ---
    setHTML('.ticker__track', (c.ticker || []).map((item) =>
      '<li><strong>' + t(item.bold) + '</strong> ' + t(item.text) + '</li><li>' + icon('spark') + '</li>').join(''));

    // --- About ---
    setText('#about .eyebrow', c.about.eyebrow);
    setText('#about-title', c.about.title);
    setText('.about__statement', c.about.statement);
    setHTML('.about__text',
      (c.about.paragraphs || []).map((p) => '<p>' + t(p) + '</p>').join('') +
      (c.about.linkText ? '<a class="link-arrow" href="#contact">' + t(c.about.linkText) + icon('arrow') + '</a>' : ''));
    setHTML('.about__stats', (c.about.stats || []).map(function (stat) {
      const value = fill(stat.value);
      const number = /^\d+$/.test(value) ? '<span data-count="' + value + '">' + value + '</span>' : esc(value);
      return '<div class="stat" data-animate><dt>' + t(stat.label) + '</dt><dd>' + number + '</dd></div>';
    }).join(''));
    const toolTracks = $$('.tools__track');
    if (toolTracks[0]) toolTracks[0].innerHTML = (c.about.toolsRow1 || []).map((x) => '<li>' + t(x) + '</li>').join('');
    if (toolTracks[1]) toolTracks[1].innerHTML = (c.about.toolsRow2 || []).map((x) => '<li>' + t(x) + '</li>').join('');

    // --- Services ---
    setText('#services .eyebrow', c.services.eyebrow);
    setText('#services-title', c.services.title);
    setText('#services .section-lead', c.services.lead);
    setHTML('.services__list', (c.services.items || []).map(function (item, i) {
      const num = String(i + 1).padStart(2, '0');
      return '<li class="service" data-animate>' +
        '<button class="service__head" type="button" aria-expanded="' + (i === 0) + '" aria-controls="service-' + (i + 1) + '">' +
          '<span class="service__num">' + num + '</span>' +
          '<span class="service__title">' + t(item.title) + '</span>' +
          '<span class="service__toggle">' + icon('plus') + '</span>' +
        '</button>' +
        '<div class="service__body" id="service-' + (i + 1) + '"><div class="service__inner">' +
          '<p>' + t(item.text) + '</p>' +
          '<ul class="checklist">' + (item.points || []).map((p) => '<li>' + icon('check') + t(p) + '</li>').join('') + '</ul>' +
        '</div></div></li>';
    }).join(''));

    // --- Expertise tabs ---
    setText('#skills .eyebrow', c.expertise.eyebrow);
    setText('#skills-title', c.expertise.title);
    const tabs = c.expertise.tabs || [];
    setHTML('.tabs',
      '<div class="tabs__list" role="tablist" aria-label="Technical expertise">' +
      tabs.map((tab, i) =>
        '<button class="tabs__tab" role="tab" id="tab-' + i + '" aria-controls="panel-' + i + '" aria-selected="' + (i === 0) + '"' + (i ? ' tabindex="-1"' : '') + '>' +
        icon(tab.icon || 'grid') + t(tab.name) + '</button>').join('') +
      '</div>' +
      tabs.map((tab, i) =>
        '<div class="tabs__panel" role="tabpanel" id="panel-' + i + '" aria-labelledby="tab-' + i + '"' + (i ? ' hidden' : '') + '>' +
        (tab.intro ? '<p class="tabs__intro">' + t(tab.intro) + '</p>' : '') +
        '<ul class="pills">' + (tab.items || []).map((x) => '<li>' + t(x) + '</li>').join('') + '</ul></div>').join(''));

    // --- Work ---
    setText('#work .eyebrow', c.work.eyebrow);
    setText('#work-title', c.work.title);
    setText('#work .section-lead', c.work.lead);
    setHTML('.stack', (c.work.projects || []).map(function (p, i) {
      const link = safeUrl(p.link);
      const media = p.image
        ? '<img class="project__shot" src="' + esc(p.image) + '" alt="' + t(p.title) + ' preview" width="800" height="520" loading="lazy">'
        : '<svg class="project__shot" viewBox="0 0 400 260" role="img" aria-label="Website preview placeholder"><use href="#mock-site"></use></svg>';
      return '<article class="project" style="--i: ' + i + '; --mock-accent: ' + esc(p.accent || '#8a5cc7') + '">' +
        '<div class="project__content">' +
          '<ul class="project__tags">' + (p.tags || []).map((x) => '<li>' + t(x) + '</li>').join('') + '</ul>' +
          '<h3>' + t(p.title) + '</h3>' +
          '<p>' + t(p.text) + '</p>' +
          (p.role ? '<p class="project__role"><strong>My role</strong>' + t(p.role) + '</p>' : '') +
          '<a class="btn btn--light btn--sm" href="' + esc(link || '#') + '"' + (link ? ' target="_blank" rel="noopener"' : '') + ' data-placeholder-link data-cursor="view">' +
            '<span>View live site</span>' + icon('arrow') + '</a>' +
        '</div>' +
        '<div class="project__media">' + media + '</div></article>';
    }).join(''));
    setHTML('.work__note', icon('grid') + t(c.work.note));
    const workNote = $('.work__note');
    if (workNote) workNote.hidden = !c.work.note;

    // --- Process ---
    setText('#process .eyebrow', c.process.eyebrow);
    setText('#process-title', c.process.title);
    setText('#process .section-lead', c.process.lead);
    setHTML('#timeline', '<li class="timeline__line" aria-hidden="true"><span></span></li>' +
      (c.process.steps || []).map((step, i) =>
        '<li class="timeline__step" data-animate>' +
        '<span class="timeline__icon">' + icon(step.icon || 'check') + '</span>' +
        '<div><span class="timeline__num">' + String(i + 1).padStart(2, '0') + '</span><h3>' + t(step.title) + '</h3><p>' + t(step.text) + '</p></div></li>').join(''));

    // --- Why me ---
    setText('.why .eyebrow', c.why.eyebrow);
    setText('#why-title', c.why.title);
    setHTML('.why__grid', (c.why.cards || []).map((card) =>
      '<li class="why__card" data-animate>' +
      '<span class="why__icon">' + icon(card.icon || 'check') + '</span>' +
      '<h3>' + t(card.title) + '</h3><p>' + t(card.text) + '</p></li>').join(''));

    // --- Band ---
    setHTML('.band__track', ('<span>' + t(c.band.text) + '</span>' + icon('spark')).repeat(2));
    const band = $('.band');
    if (band) band.setAttribute('aria-label', fill(c.band.text) + ', go to contact form');

    // --- Contact ---
    setText('#contact .eyebrow', c.contact.eyebrow);
    setText('#contact-title', c.contact.title);
    setText('#contact .section-lead', c.contact.lead);
    setText('.lead-form__title', c.contact.formTitle);

    const contactRows = [];
    if (s.email) contactRows.push({ icon: icon('mail'), label: 'Email', html: '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' });
    if (s.phone) contactRows.push({ icon: icon('phone'), label: 'Phone', html: '<a href="' + esc(telHref(s.phone)) + '">' + esc(s.phone) + '</a>' });
    if (s.location) contactRows.push({ icon: icon('pin'), label: 'Location', html: '<span>' + esc(s.location) + '</span>' });
    socials.forEach(function (item) {
      const href = socialHref(item);
      const info = SOCIALS[item.platform] || SOCIALS.other;
      contactRows.push({
        icon: socialIcon(item.platform),
        label: info.label === 'Other link' ? (item.label || 'Link') : info.label,
        html: '<a href="' + esc(href) + '"' + (isExternal(href) ? ' target="_blank" rel="noopener"' : '') + '>' + t(item.label || info.label) + '</a>'
      });
    });
    setHTML('.contact__list', contactRows.map((row) =>
      '<li><span class="contact__icon">' + row.icon + '</span><div><span class="contact__label">' + esc(row.label) + '</span>' + row.html + '</div></li>').join(''));

    // --- Closing CTA ---
    setHTML('#cta-title', t(c.cta.line1) + '<br><em>' + t(c.cta.line2) + '</em>');
    const ctaBtn = $('.cta__actions .btn--light');
    if (ctaBtn) ctaBtn.innerHTML = t(c.cta.button) + icon('arrow');

    // --- Footer ---
    setText('.site-footer__tag', c.footer.tagline);
    const footerLists = $$('.site-footer__top ul');
    const footerContact = footerLists[footerLists.length - 1];
    if (footerContact) {
      footerContact.innerHTML =
        (s.email ? '<li><a href="mailto:' + esc(s.email) + '">Email</a></li>' : '') +
        (s.phone ? '<li><a href="' + esc(telHref(s.phone)) + '">Phone</a></li>' : '') +
        socials.map(function (item) {
          const href = socialHref(item);
          return '<li><a href="' + esc(href) + '"' + (isExternal(href) ? ' target="_blank" rel="noopener"' : '') + '>' + t(item.label || (SOCIALS[item.platform] || SOCIALS.other).label) + '</a></li>';
        }).join('');
    }
  }


  /* 5. Load saved content (website only)
     ------------------------------------------------------------------------ */
  function load() {
    const controller = 'AbortController' in window ? new AbortController() : null;
    // Never keep visitors waiting: give up after 3 seconds and show the built-in page
    const timer = setTimeout(function () { if (controller) controller.abort(); }, 3000);

    return fetch('/api/content', { signal: controller ? controller.signal : undefined })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (data && data.content) apply(data.content);
      })
      .catch(function () { /* keep the built-in HTML */ })
      .then(function () { clearTimeout(timer); });
  }

  window.SiteContent = {
    DEFAULTS: DEFAULTS,
    SITE_ICONS: SITE_ICONS,
    SOCIALS: SOCIALS,
    SIMPLE_ICONS: SIMPLE_ICONS,
    merge: merge,
    apply: apply
  };

  // The website sets data-page="site" on <html>; the dashboard doesn't
  if (document.documentElement.dataset.page === 'site') {
    window.__contentReady = load();
  }
})();
