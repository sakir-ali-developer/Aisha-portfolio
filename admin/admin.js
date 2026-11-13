/* ==========================================================================
   Aisha | Dashboard
   admin.js

   1.  Setup & state
   2.  Small helpers (DOM, API, toasts, dialogs)
   3.  Login
   4.  App shell (sidebar, topbar, routing, saving)
   5.  Form building blocks (fields, rows, chips, icons, images, lists)
   6.  Pages
   7.  Start
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Setup & state
     ------------------------------------------------------------------------ */
  const SC = window.SiteContent;
  const root = document.getElementById('root');
  const MAX_UPLOAD = 4 * 1024 * 1024;

  const state = {
    user: null,
    content: null,         // the content being edited
    savedJSON: '',         // last saved version, to detect unsaved changes
    updatedAt: null,
    leads: null,
    pendingDeletes: [],    // uploaded files to remove after the next save
    open: {}               // which list items are expanded, per list
  };

  const NAV = [
    { group: 'Dashboard' },
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'leads', label: 'Leads', icon: 'inbox', badge: true },
    { group: 'Site settings' },
    { id: 'settings', label: 'General', icon: 'gear' },
    { id: 'socials', label: 'Contact & Social', icon: 'link' },
    { id: 'media', label: 'Photo & CV', icon: 'image' },
    { group: 'Page content' },
    { id: 'hero', label: 'Hero', icon: 'star' },
    { id: 'about', label: 'About & Stats', icon: 'user' },
    { id: 'services', label: 'Services', icon: 'layers' },
    { id: 'expertise', label: 'Expertise Tabs', icon: 'grid' },
    { id: 'projects', label: 'Projects', icon: 'briefcase' },
    { id: 'process', label: 'Process', icon: 'flow' },
    { id: 'why', label: 'Why Me', icon: 'shield' },
    { id: 'closing', label: 'Contact & Footer', icon: 'mail' }
  ];

  const VARS = ['{{experience}}', '{{teamSize}}', '{{location}}', '{{email}}'];


  /* 2. Small helpers
     ------------------------------------------------------------------------ */
  const clone = (value) => JSON.parse(JSON.stringify(value));

  // h('div', { class: 'x', on: { click } }, child, 'text', ...)
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        const value = props[key];
        if (value == null || value === false) return;
        if (key === 'class') el.className = value;
        else if (key === 'text') el.textContent = value;
        else if (key === 'on') Object.keys(value).forEach((evt) => el.addEventListener(evt, value[evt]));
        else if (key === 'value') el.value = value;
        else if (key in el && typeof value !== 'string') el[key] = value;
        else el.setAttribute(key, value === true ? '' : value);
      });
    }
    children.flat().forEach(function (child) {
      if (child == null || child === false) return;
      el.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return el;
  }

  function icon(name, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#icon-' + name);
    svg.append(use);
    return svg;
  }

  function socialIcon(platform) {
    const info = SC.SOCIALS[platform] || SC.SOCIALS.other;
    if (info.sprite) return icon(info.sprite);
    const span = h('span', { class: 'sicon' });
    span.style.setProperty('--sicon', 'url(' + SC.SIMPLE_ICONS + info.brand + '.svg)');
    return span;
  }

  function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce(function (acc, key, i) {
      if (acc[key] == null) acc[key] = /^\d+$/.test(keys[i + 1] || last) ? [] : {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  async function api(path, options) {
    const opts = Object.assign({ method: 'GET', headers: {} }, options);
    if (opts.json !== undefined) {
      opts.body = JSON.stringify(opts.json);
      opts.headers['Content-Type'] = 'application/json';
      delete opts.json;
    }
    opts.credentials = 'same-origin';
    const response = await fetch(path, opts);
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== '/api/login' && path !== '/api/session') {
      toast('Your session ended. Please log in again.', true);
      showLogin();
      throw new Error('Unauthorised');
    }
    if (!response.ok) throw new Error(data.error || 'Request failed (' + response.status + ')');
    return data;
  }

  function toast(message, isError) {
    const box = h('div', { class: 'toast' + (isError ? ' is-error' : ''), role: 'status' },
      icon(isError ? 'info' : 'circle-check'), message);
    document.getElementById('toasts').append(box);
    setTimeout(function () {
      box.classList.add('is-out');
      setTimeout(() => box.remove(), 300);
    }, isError ? 5200 : 3200);
  }

  // Glass confirm dialog. Resolves true/false.
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      const dialog = h('dialog', { class: 'dialog' },
        h('div', { class: 'dialog__head' }, h('h3', { text: title })),
        h('p', { class: 'muted', text: text }),
        h('div', { class: 'dialog__foot' },
          h('button', { class: 'btn btn--glass', type: 'button', value: 'no', on: { click: () => dialog.close('no') } }, 'Cancel'),
          h('button', { class: 'btn ' + (danger ? 'btn--danger' : 'btn--primary'), type: 'button', on: { click: () => dialog.close('yes') } }, okLabel || 'OK')));
      dialog.addEventListener('close', function () {
        resolve(dialog.returnValue === 'yes');
        dialog.remove();
      });
      document.body.append(dialog);
      dialog.showModal();
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    if (isNaN(date)) return '';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' d ago';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const isDirty = () => state.content && JSON.stringify(state.content) !== state.savedJSON;


  /* 3. Login
     ------------------------------------------------------------------------ */
  function showLogin() {
    state.user = null;
    document.title = 'Log in | Aisha';
    const error = h('p', { class: 'login__error', role: 'alert' });
    const user = h('input', { class: 'input', id: 'login-user', name: 'username', autocomplete: 'username', placeholder: 'Username', required: true, value: 'admin' });
    const pass = h('input', { class: 'input', id: 'login-pass', name: 'password', type: 'password', autocomplete: 'current-password', placeholder: 'Password', required: true, value: 'password123' });
    const eye = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Show password' }, icon('eye'));
    eye.addEventListener('click', function () {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      eye.replaceChildren(icon(show ? 'eye-off' : 'eye'));
      eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    const submit = h('button', { class: 'btn btn--primary btn--block', type: 'submit' }, 'Sign in', icon('arrow-right'));

    const demoBadge = h('div', { class: 'login__demo', style: 'margin: 0 0 20px; padding: 12px 14px; background: rgba(138, 92, 199, 0.15); border: 1px dashed rgba(169, 124, 230, 0.4); border-radius: 12px; font-size: 0.82rem; color: #d8c4f5; text-align: left;' },
      h('div', { style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;' },
        h('span', { style: 'font-weight: 600; color: #fff;' }, '🔑 Demo Logins Ready'),
        h('button', {
          type: 'button',
          style: 'background: rgba(255, 255, 255, 0.12); color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; cursor: pointer;',
          onclick: () => { user.value = 'admin'; pass.value = 'password123'; user.focus(); }
        }, 'Auto-fill')
      ),
      h('div', { style: 'line-height: 1.5; color: #aaa0b8;' },
        'Username: ', h('strong', { style: 'color: #fff;' }, 'admin'), ' (or ', h('strong', { style: 'color: #fff;' }, 'aisha'), ')<br>',
        'Password: ', h('strong', { style: 'color: #fff;' }, 'password123')
      )
    );

    const form = h('form', { class: 'login__form', novalidate: true },
      h('label', { class: 'sr-only', for: 'login-user' }, 'Username'), user,
      h('label', { class: 'sr-only', for: 'login-pass' }, 'Password'), h('div', { class: 'password' }, pass, eye),
      error, submit);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      error.textContent = '';
      if (!user.value.trim() || !pass.value) { error.textContent = 'Enter your username and password.'; return; }
      submit.disabled = true;
      submit.classList.add('is-loading');
      try {
        const data = await api('/api/login', { method: 'POST', json: { username: user.value.trim(), password: pass.value } });
        state.user = data.user;
        await startApp();
      } catch (err) {
        error.textContent = err.message;
        pass.select();
      } finally {
        submit.disabled = false;
        submit.classList.remove('is-loading');
      }
    });

    root.replaceChildren(h('main', { class: 'login' },
      h('div', { class: 'login__card glass' },
        h('p', { class: 'login__logo' }, 'Aisha', h('span', { text: '.' })),
        h('h1', { class: 'login__title', text: 'Welcome back' }),
        h('p', { class: 'login__sub', text: 'Sign in to manage your portfolio.' }),
        demoBadge,
        form,
        h('a', { class: 'login__back', href: '/' }, '← Back to website'))));
    setTimeout(() => submit.focus(), 50);
  }


  /* 4. App shell
     ------------------------------------------------------------------------ */
  let els = {};

  async function startApp() {
    root.replaceChildren(h('div', { class: 'boot' }, icon('loader')));
    // Logged back in after the session ended: keep the unsaved edits
    if (state.content && isDirty()) {
      renderShell();
      loadLeads(true);
      route();
      toast('Welcome back. Your unsaved changes are still here.');
      return;
    }
    try {
      const data = await api('/api/content');
      state.content = SC.merge(clone(SC.DEFAULTS), data.content || {});
      state.updatedAt = data.updatedAt;
      state.savedJSON = JSON.stringify(state.content);
    } catch (err) {
      if (err.message === 'Unauthorised') return;
      state.content = clone(SC.DEFAULTS);
      state.savedJSON = JSON.stringify(state.content);
      toast('Could not load saved content: ' + err.message, true);
    }
    renderShell();
    loadLeads(true);
    route();
  }

  function renderShell() {
    const nav = h('nav', { class: 'nav', 'aria-label': 'Dashboard' });
    NAV.forEach(function (item) {
      if (item.group) { nav.append(h('p', { class: 'nav__group', text: item.group })); return; }
      const link = h('a', { class: 'nav__link', href: '#/' + item.id, 'data-route': item.id },
        icon(item.icon), item.label, item.badge ? h('span', { class: 'nav__badge', hidden: true }) : null);
      nav.append(link);
    });

    const sidebar = h('aside', { class: 'sidebar glass' },
      h('div', { class: 'sidebar__brand' },
        h('span', { class: 'sidebar__mark', text: 'A' }),
        h('div', null, h('p', { class: 'sidebar__name', text: 'Aisha Ali Muhammad' }), h('p', { class: 'sidebar__role', text: 'Portfolio dashboard' }))),
      nav,
      h('div', { class: 'sidebar__foot' },
        h('a', { class: 'nav__link', href: '/', target: '_blank', rel: 'noopener' }, icon('external'), 'View website'),
        h('button', { class: 'nav__link', type: 'button', style: 'border:0;background:none;cursor:pointer;width:100%', on: { click: logout } }, icon('logout'), 'Log out')));

    const saveState = h('span', { class: 'save-state' }, h('span', { class: 'save-state__dot' }), h('span', { class: 'save-state__text' }));
    const saveBtn = h('button', { class: 'btn btn--primary', type: 'button', on: { click: save } }, icon('check'), 'Save');
    const menuBtn = h('button', { class: 'icon-btn topbar__menu', type: 'button', 'aria-label': 'Open menu', on: { click: () => toggleSidebar(true) } }, icon('menu'));
    const title = h('h1', { class: 'topbar__title' });

    const topbar = h('header', { class: 'topbar glass' },
      menuBtn, title, h('span', { class: 'topbar__spacer' }), saveState,
      h('a', { class: 'btn btn--glass btn--sm topbar__view', href: '/', target: '_blank', rel: 'noopener' }, icon('eye'), h('span', { text: 'Preview' })),
      saveBtn);

    const page = h('div', { class: 'page-wrap' });
    const scrim = h('div', { class: 'scrim', hidden: true, on: { click: () => toggleSidebar(false) } });

    root.replaceChildren(h('div', { class: 'app' }, sidebar, h('div', { class: 'main' }, topbar, page)), scrim);
    els = { sidebar, nav, saveState, saveBtn, title, page, scrim };
    updateSaveState();
  }

  function toggleSidebar(open) {
    els.sidebar.classList.toggle('is-open', open);
    els.scrim.hidden = !open;
  }

  function updateSaveState() {
    if (!els.saveState) return;
    const dirty = isDirty();
    els.saveState.classList.toggle('is-dirty', dirty);
    els.saveState.querySelector('.save-state__text').textContent =
      dirty ? 'Unsaved changes' : (state.updatedAt ? 'Saved ' + formatDate(state.updatedAt).toLowerCase() : 'Not saved yet');
    els.saveBtn.disabled = !dirty;
  }

  function changed() { updateSaveState(); }

  async function save() {
    if (!isDirty()) return;
    els.saveBtn.disabled = true;
    els.saveBtn.classList.add('is-loading');
    els.saveBtn.firstChild.replaceWith(icon('loader'));
    try {
      const data = await api('/api/content', { method: 'PUT', json: { content: state.content } });
      state.savedJSON = JSON.stringify(state.content);
      state.updatedAt = data.updatedAt;
      // Old uploads that are no longer used can now be deleted
      const used = state.savedJSON;
      const deletes = state.pendingDeletes.filter((url) => !used.includes(url));
      state.pendingDeletes = [];
      deletes.forEach((url) => api('/api/upload?url=' + encodeURIComponent(url), { method: 'DELETE' }).catch(() => {}));
      toast('Saved. Your website updates within about 30 seconds.');
    } catch (err) {
      if (err.message !== 'Unauthorised') toast('Save failed: ' + err.message, true);
    } finally {
      els.saveBtn.classList.remove('is-loading');
      els.saveBtn.firstChild.replaceWith(icon('check'));
      updateSaveState();
    }
  }

  async function logout() {
    if (isDirty() && !(await confirmBox('Log out?', 'You have unsaved changes. They will be lost.', 'Log out', true))) return;
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    state.content = null;
    state.savedJSON = '';
    location.hash = '';
    showLogin();
  }

  function route() {
    if (!state.user || !els.page) return;
    const id = (location.hash.replace(/^#\/?/, '') || 'overview').split('/')[0];
    const page = PAGES[id] ? id : 'overview';
    const navItem = NAV.find((item) => item.id === page);

    els.nav.querySelectorAll('[data-route]').forEach((link) => link.classList.toggle('is-active', link.dataset.route === page));
    els.title.textContent = navItem.label;
    document.title = navItem.label + ' | Dashboard';
    toggleSidebar(false);
    els.page.replaceChildren(PAGES[page]());
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('hashchange', route);

  window.addEventListener('beforeunload', function (event) {
    if (isDirty()) { event.preventDefault(); event.returnValue = ''; }
  });

  // Ctrl/Cmd + S saves
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && state.user) {
      event.preventDefault();
      save();
    }
  });


  /* 5. Form building blocks
     ------------------------------------------------------------------------ */
  function page(title, sub, ...children) {
    return h('section', { class: 'page' },
      h('div', { class: 'page__head' }, h('div', null, h('h2', { class: 'page__title', text: title }), sub ? h('p', { class: 'page__sub' }, sub) : null)),
      children);
  }

  function panel(title, iconName, hint, ...children) {
    return h('div', { class: 'panel glass' },
      h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title' }, iconName ? icon(iconName) : null, title)),
      hint ? h('p', { class: 'panel__hint' }, hint) : null,
      children);
  }

  // Inserts text at the cursor of an input/textarea
  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.focus();
    input.setSelectionRange(start + text.length, start + text.length);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function varChips(input) {
    return h('div', { class: 'vars' }, VARS.map((v) =>
      h('button', { type: 'button', title: 'Insert ' + v, on: { click: () => insertAtCursor(input, v) } }, v)));
  }

  /* field({ path, label, type, hint, full, vars, placeholder, options, rows, onInput }) */
  function field(spec) {
    const id = 'f-' + spec.path.replace(/\./g, '-');
    const value = getPath(state.content, spec.path);
    let input;

    if (spec.type === 'textarea') {
      input = h('textarea', { class: 'textarea', id, rows: spec.rows || 3, placeholder: spec.placeholder || '' });
      input.value = value ?? '';
    } else if (spec.type === 'select') {
      input = h('select', { class: 'select', id }, spec.options.map((o) => h('option', { value: o.value, text: o.label })));
      input.value = value ?? spec.options[0].value;
    } else {
      input = h('input', { class: 'input', id, type: spec.type || 'text', placeholder: spec.placeholder || '' });
      input.value = value ?? '';
    }

    input.addEventListener(spec.type === 'select' || spec.type === 'color' ? 'change' : 'input', function () {
      setPath(state.content, spec.path, input.value);
      if (spec.onInput) spec.onInput(input.value);
      changed();
    });

    return h('div', { class: 'field' + (spec.full || spec.type === 'textarea' ? ' field--full' : '') },
      h('label', { class: 'field__label', for: id, text: spec.label }),
      input,
      spec.vars ? varChips(input) : null,
      spec.hint ? h('p', { class: 'field__hint' }, spec.hint) : null);
  }

  function fields(base, specs) {
    return h('div', { class: 'fields' }, specs.map((spec) => field(Object.assign({}, spec, { path: base + '.' + spec.key }))));
  }

  // Moves an array item and returns the array
  function move(list, from, to) {
    if (to < 0 || to >= list.length) return list;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    return list;
  }

  /* rows: a list of plain strings, each with its own text box */
  function rows(spec) {
    const wrap = h('div', { class: 'field field--full' });
    function render() {
      const list = getPath(state.content, spec.path) || [];
      const box = h('div', { class: 'rows' });
      list.forEach(function (text, i) {
        const input = spec.multiline
          ? h('textarea', { class: 'textarea', rows: 3 })
          : h('input', { class: 'input' });
        input.value = text;
        input.setAttribute('aria-label', spec.label + ' ' + (i + 1));
        input.addEventListener('input', () => { list[i] = input.value; changed(); });
        box.append(h('div', { class: 'row' }, input,
          h('div', { class: 'row__actions' },
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', on: { click: () => { move(list, i, i - 1); changed(); render(); } } }, icon('up')),
            h('button', { class: 'icon-btn icon-btn--danger', type: 'button', 'aria-label': 'Remove', on: { click: () => { list.splice(i, 1); changed(); render(); } } }, icon('trash')))));
      });
      box.append(h('button', { class: 'add-btn', type: 'button', on: { click: () => {
        list.push('');
        setPath(state.content, spec.path, list);
        changed();
        render();
        const inputs = wrap.querySelectorAll('.input, .textarea');
        if (inputs.length) inputs[inputs.length - 1].focus();
      } } }, icon('plus'), spec.addLabel || 'Add line'));
      wrap.replaceChildren(h('span', { class: 'field__label', text: spec.label }), box,
        spec.hint ? h('p', { class: 'field__hint' }, spec.hint) : null);
    }
    render();
    return wrap;
  }

  /* chips: a list of short strings shown as removable pills (drag to reorder) */
  function chips(spec) {
    const wrap = h('div', { class: 'field' + (spec.full === false ? '' : ' field--full') });
    function render() {
      const list = getPath(state.content, spec.path) || [];
      setPath(state.content, spec.path, list);
      const box = h('div', { class: 'chips' });
      let dragFrom = null;

      list.forEach(function (text, i) {
        const chip = h('span', { class: 'chip', draggable: 'true' }, text,
          h('button', { type: 'button', 'aria-label': 'Remove ' + text, on: { click: () => { list.splice(i, 1); changed(); render(); } } }, icon('close')));
        chip.addEventListener('dragstart', (e) => { dragFrom = i; chip.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; });
        chip.addEventListener('dragend', () => chip.classList.remove('is-dragging'));
        chip.addEventListener('dragover', (e) => e.preventDefault());
        chip.addEventListener('drop', (e) => {
          e.preventDefault();
          if (dragFrom === null || dragFrom === i) return;
          move(list, dragFrom, i);
          changed();
          render();
        });
        box.append(chip);
      });

      const input = h('input', { placeholder: spec.placeholder || 'Type and press Enter', 'aria-label': 'Add to ' + spec.label });
      function add() {
        const parts = input.value.split(',').map((x) => x.trim()).filter(Boolean);
        input.value = '';
        if (!parts.length) return;
        list.push(...parts);
        changed();
        render();
        wrap.querySelector('.chips input').focus();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
        if (e.key === 'Backspace' && !input.value && list.length) { list.pop(); changed(); render(); wrap.querySelector('.chips input').focus(); }
      });
      input.addEventListener('blur', add);
      box.append(input);
      box.addEventListener('click', (e) => { if (e.target === box) input.focus(); });

      wrap.replaceChildren(h('span', { class: 'field__label', text: spec.label }), box,
        h('p', { class: 'field__hint', text: spec.hint || 'Press Enter to add. Drag to reorder.' }));
    }
    render();
    return wrap;
  }

  /* iconPicker: choose one of the website's line icons */
  function iconPicker(spec) {
    const wrap = h('div', { class: 'field' });
    function render() {
      const current = getPath(state.content, spec.path) || 'check';
      const grid = h('div', { class: 'icon-pick__grid', hidden: true, role: 'listbox' });
      SC.SITE_ICONS.forEach(function (name) {
        grid.append(h('button', {
          type: 'button', title: name, class: name === current ? 'is-active' : '', 'aria-label': name,
          on: { click: () => { setPath(state.content, spec.path, name); changed(); if (spec.onChange) spec.onChange(); render(); } }
        }, icon(name)));
      });
      const btn = h('button', { class: 'input icon-pick__btn', type: 'button', 'aria-haspopup': 'listbox' }, icon(current), current);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        grid.hidden = !grid.hidden;
        if (!grid.hidden) {
          const close = (ev) => { if (!grid.contains(ev.target)) { grid.hidden = true; document.removeEventListener('click', close); } };
          setTimeout(() => document.addEventListener('click', close), 0);
        }
      });
      wrap.replaceChildren(h('span', { class: 'field__label', text: spec.label || 'Icon' }), h('div', { class: 'icon-pick' }, btn, grid));
    }
    render();
    return wrap;
  }

  /* fileField: upload / replace / remove an image or PDF */
  function fileField(spec) {
    const wrap = h('div', { class: 'field field--full' });
    const accept = spec.kind === 'pdf' ? 'application/pdf' : 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

    function render(uploading) {
      const value = getPath(state.content, spec.path) || '';
      const preview = h('div', { class: 'media__preview dropzone' + (spec.wide ? ' media__preview--wide' : '') });

      if (uploading) {
        preview.append(h('div', { class: 'media__file' }, icon('loader'), 'Uploading…'));
      } else if (!value) {
        preview.append(h('div', { class: 'media__file' }, icon(spec.kind === 'pdf' ? 'file' : 'image'), 'Nothing here yet'));
      } else if (spec.kind === 'pdf') {
        preview.append(h('div', { class: 'media__file' }, icon('file'), value.split('/').pop()));
      } else {
        preview.append(h('img', { src: value, alt: 'Preview' }));
      }

      const fileInput = h('input', { type: 'file', accept, hidden: true });
      fileInput.addEventListener('change', () => fileInput.files[0] && upload(fileInput.files[0]));

      // Drop a file straight onto the preview
      preview.addEventListener('dragover', (e) => { e.preventDefault(); preview.classList.add('is-over'); });
      preview.addEventListener('dragleave', () => preview.classList.remove('is-over'));
      preview.addEventListener('drop', (e) => {
        e.preventDefault();
        preview.classList.remove('is-over');
        if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
      });

      const urlInput = h('input', { class: 'input', type: 'text', placeholder: 'https://… or file name', value });
      urlInput.addEventListener('change', () => { setPath(state.content, spec.path, urlInput.value.trim()); changed(); render(); });

      wrap.replaceChildren(
        h('span', { class: 'field__label', text: spec.label }),
        h('div', { class: 'media' }, preview,
          h('div', { class: 'media__controls' },
            h('div', { class: 'media__buttons' },
              h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: uploading, on: { click: () => fileInput.click() } },
                icon('upload'), value ? 'Replace' : 'Upload'),
              value ? h('a', { class: 'btn btn--glass btn--sm', href: value, target: '_blank', rel: 'noopener' }, icon('external'), 'Open') : null,
              value ? h('button', { class: 'btn btn--danger btn--sm', type: 'button', on: { click: remove } }, icon('trash'), 'Remove') : null),
            uploading ? h('div', { class: 'progress' }, h('span')) : null,
            h('div', { class: 'field' }, h('span', { class: 'field__hint', text: 'Or paste a link:' }), urlInput),
            h('p', { class: 'field__hint', text: spec.hint || (spec.kind === 'pdf' ? 'PDF, up to 4 MB.' : 'PNG, JPG, WEBP or SVG, up to 4 MB. Drag a file onto the preview to upload.') }),
            fileInput)));
    }

    async function upload(file) {
      const okType = spec.kind === 'pdf' ? file.type === 'application/pdf' : /^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type);
      if (!okType) { toast(spec.kind === 'pdf' ? 'Please choose a PDF file.' : 'Please choose an image (PNG, JPG, WEBP, GIF or SVG).', true); return; }
      if (file.size > MAX_UPLOAD) { toast('File is too big (' + (file.size / 1048576).toFixed(1) + ' MB). The limit is 4 MB.', true); return; }

      render(true);
      try {
        const data = await api('/api/upload', {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }
        });
        const old = getPath(state.content, spec.path);
        if (old) state.pendingDeletes.push(old);
        setPath(state.content, spec.path, data.url);
        changed();
        toast('Uploaded. Click Save to publish it.');
      } catch (err) {
        if (err.message !== 'Unauthorised') toast('Upload failed: ' + err.message, true);
      }
      render(false);
    }

    function remove() {
      const old = getPath(state.content, spec.path);
      if (old) state.pendingDeletes.push(old);
      setPath(state.content, spec.path, '');
      changed();
      render(false);
    }

    render(false);
    return wrap;
  }

  /* listEditor: repeatable cards (add, remove, duplicate, drag to reorder)
     spec = { path, label, addLabel, title(item, i), titleIcon(item), body(itemPath, rerender), make() } */
  function listEditor(spec) {
    const wrap = h('div', { class: 'list' });
    const openSet = state.open[spec.path] || (state.open[spec.path] = new Set(spec.openFirst ? [0] : []));
    let dragFrom = null;

    function render() {
      const list = getPath(state.content, spec.path) || [];
      setPath(state.content, spec.path, list);
      wrap.replaceChildren();

      list.forEach(function (item, i) {
        const isOpen = openSet.has(i);
        const titleText = h('span', { text: spec.title(item, i) || 'Untitled' });
        const titleBtn = h('button', { class: 'item__title', type: 'button', 'aria-expanded': String(isOpen) },
          spec.titleIcon ? spec.titleIcon(item) : null, titleText);

        const grip = h('button', { class: 'item__grip', type: 'button', 'aria-label': 'Drag to reorder', title: 'Drag to reorder' }, icon('grip'));
        const card = h('div', { class: 'item' + (isOpen ? ' is-open' : '') });

        // Only the grip starts a drag, so text inside inputs can still be selected
        grip.addEventListener('pointerdown', () => card.setAttribute('draggable', 'true'));
        card.addEventListener('dragstart', (e) => { dragFrom = i; card.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        card.addEventListener('dragend', () => { card.removeAttribute('draggable'); card.classList.remove('is-dragging'); });
        card.addEventListener('dragover', (e) => { if (dragFrom !== null) { e.preventDefault(); card.classList.add('is-over'); } });
        card.addEventListener('dragleave', () => card.classList.remove('is-over'));
        card.addEventListener('drop', function (e) {
          e.preventDefault();
          card.classList.remove('is-over');
          if (dragFrom === null || dragFrom === i) return;
          move(list, dragFrom, i);
          remapOpen(dragFrom, i);
          dragFrom = null;
          changed();
          render();
        });

        titleBtn.addEventListener('click', function () {
          if (openSet.has(i)) openSet.delete(i); else openSet.add(i);
          render();
        });

        const actions = h('div', { class: 'item__actions' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', title: 'Move up', disabled: i === 0,
            on: { click: () => { move(list, i, i - 1); remapOpen(i, i - 1); changed(); render(); } } }, icon('up')),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move down', title: 'Move down', disabled: i === list.length - 1,
            on: { click: () => { move(list, i, i + 1); remapOpen(i, i + 1); changed(); render(); } } }, icon('down')),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Duplicate', title: 'Duplicate',
            on: { click: () => { list.splice(i + 1, 0, clone(item)); shiftOpen(i + 1, 1); openSet.add(i + 1); changed(); render(); } } }, icon('copy')),
          h('button', { class: 'icon-btn icon-btn--danger', type: 'button', 'aria-label': 'Delete', title: 'Delete',
            on: { click: async () => {
              if (!(await confirmBox('Delete this ' + (spec.label || 'item') + '?', '“' + (spec.title(item, i) || 'Untitled') + '” will be removed when you save.', 'Delete', true))) return;
              list.splice(i, 1);
              openSet.delete(i);
              shiftOpen(i, -1);
              changed();
              render();
            } } }, icon('trash')));

        card.append(h('div', { class: 'item__head' }, grip, h('span', { class: 'item__num', text: String(i + 1).padStart(2, '0') }), titleBtn, actions,
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': isOpen ? 'Collapse' : 'Expand', on: { click: () => titleBtn.click() } }, icon('down', 'item__chev'))));

        if (isOpen) {
          // Keep the card title in sync while typing
          const body = spec.body(spec.path + '.' + i, function () { titleText.textContent = spec.title(list[i], i) || 'Untitled'; });
          card.append(h('div', { class: 'item__body' }, body));
        }
        wrap.append(card);
      });

      wrap.append(h('button', { class: 'add-btn', type: 'button', on: { click: () => {
        list.push(spec.make());
        openSet.add(list.length - 1);
        changed();
        render();
        const cards = wrap.querySelectorAll('.item');
        const lastCard = cards[cards.length - 1];
        if (lastCard) {
          lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const firstInput = lastCard.querySelector('.input, .textarea');
          if (firstInput) setTimeout(() => firstInput.focus(), 300);
        }
      } } }, icon('plus'), spec.addLabel || 'Add item'));
    }

    // Keep the right cards open when items move
    function remapOpen(from, to) {
      const wasOpen = openSet.has(from);
      const others = Array.from(openSet).filter((x) => x !== from);
      openSet.clear();
      others.forEach(function (x) {
        let y = x;
        if (from < to && x > from && x <= to) y = x - 1;
        if (from > to && x >= to && x < from) y = x + 1;
        openSet.add(y);
      });
      if (wasOpen) openSet.add(to);
    }
    function shiftOpen(from, by) {
      const moved = Array.from(openSet).map((x) => (x >= from ? x + by : x));
      openSet.clear();
      moved.forEach((x) => openSet.add(x));
    }

    render();
    return wrap;
  }

  // Shortcut for fields inside a list item, with live title updates
  function itemFields(itemPath, specs, onTitle) {
    return h('div', { class: 'fields' }, specs.map(function (spec) {
      const full = Object.assign({}, spec, { path: itemPath + '.' + spec.key });
      if (spec.type === 'icon') return iconPicker(Object.assign(full, { onChange: onTitle }));
      if (spec.type === 'chips') return chips(full);
      if (spec.type === 'image') return fileField(full);
      if (spec.key === spec.titleKey || spec.isTitle) full.onInput = onTitle;
      return field(full);
    }));
  }


  /* 6. Pages
     ------------------------------------------------------------------------ */
  const PAGES = {};

  /* --- Overview --- */
  PAGES.overview = function () {
    const s = state.content.settings;
    const leads = state.leads || [];
    const unread = leads.filter((l) => !l.is_read).length;
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const stat = (iconName, value, label) => h('div', { class: 'stat glass' },
      h('span', { class: 'stat__icon' }, icon(iconName)), h('p', { class: 'stat__value', text: value }), h('p', { class: 'stat__label', text: label }));

    const recent = h('div', { class: 'leads' });
    if (state.leads === null) recent.append(h('p', { class: 'empty' }, icon('loader'), 'Loading leads…'));
    else if (!leads.length) recent.append(h('div', { class: 'empty' }, icon('inbox'), 'No form submissions yet. They will appear here.'));
    else leads.slice(0, 5).forEach((lead) => recent.append(leadRow(lead)));

    const quick = [
      ['settings', 'gear', 'Experience & location'], ['media', 'image', 'Hero photo & CV'],
      ['socials', 'link', 'Social links'], ['projects', 'briefcase', 'Projects'],
      ['expertise', 'grid', 'Skills & tabs'], ['services', 'layers', 'Services']
    ];

    return page(greet + ', Aisha', 'Here is what is happening with your portfolio.',
      h('div', { class: 'stats' },
        stat('inbox', String(leads.length), 'Total leads'),
        stat('mail', String(unread), 'Unread leads'),
        stat('briefcase', (s.experience || '0') + ' yrs', 'Experience shown'),
        stat('clock', state.updatedAt ? formatDate(state.updatedAt) : 'Never', 'Last saved')),
      h('div', { class: 'grid-2' },
        panel('Recent leads', 'inbox', null, recent,
          leads.length ? h('a', { class: 'btn btn--glass btn--sm', href: '#/leads', style: 'margin-top:14px' }, 'View all leads', icon('arrow-right')) : null),
        h('div', null,
          panel('Quick edit', 'spark', null, h('div', { class: 'quick' }, quick.map(([id, ic, label]) => h('a', { href: '#/' + id }, icon(ic), label)))),
          panel('Coming in Phase 2', 'chart', null,
            h('div', { class: 'soon' }, icon('info'),
              h('p', { class: 'muted', text: 'Page views, visitors by country and device, and a drag-and-drop section builder (rows, columns, grids, backgrounds, headings, buttons and lists).' }))))));
  };

  /* --- Leads --- */
  async function loadLeads(silent) {
    try {
      const data = await api('/api/leads');
      state.leads = data.leads || [];
    } catch (err) {
      if (err.message === 'Unauthorised') return;
      state.leads = state.leads || [];
      if (!silent) toast('Could not load leads: ' + err.message, true);
    }
    updateBadge();
    const current = (location.hash.replace(/^#\/?/, '') || 'overview');
    if (current === 'leads' || current === 'overview') route();
  }

  function updateBadge() {
    const badge = els.nav && els.nav.querySelector('.nav__badge');
    if (!badge) return;
    const unread = (state.leads || []).filter((l) => !l.is_read).length;
    badge.textContent = unread;
    badge.hidden = !unread;
  }

  function leadRow(lead) {
    const initials = (lead.name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const row = h('div', { class: 'lead' + (lead.is_read ? '' : ' is-unread'), role: 'button', tabindex: '0' },
      h('span', { class: 'lead__avatar', text: initials }),
      h('div', { style: 'min-width:0' },
        h('p', { class: 'lead__name' }, lead.is_read ? null : h('span', { class: 'dot', title: 'Unread' }), lead.name),
        h('p', { class: 'lead__email', text: lead.email })),
      h('p', { class: 'lead__msg', text: lead.message }),
      h('p', { class: 'lead__date', text: formatDate(lead.created_at) }),
      lead.reason ? h('span', { class: 'tag', text: lead.reason }) : h('span'));
    row.addEventListener('click', () => openLead(lead));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLead(lead); } });
    return row;
  }

  async function setRead(lead, isRead) {
    lead.is_read = isRead;
    updateBadge();
    try { await api('/api/leads?id=' + lead.id, { method: 'PATCH', json: { is_read: isRead } }); }
    catch (err) { if (err.message !== 'Unauthorised') toast('Could not update: ' + err.message, true); }
  }

  function openLead(lead) {
    if (!lead.is_read) setRead(lead, true);
    const interests = Array.isArray(lead.interests) ? lead.interests : [];
    const row = (label, value) => value ? h('div', { class: 'detail__row' }, h('dt', { text: label }), h('dd', null, value)) : null;
    const safeLink = /^https?:\/\//i.test(lead.reference_link || '') ? h('a', { href: lead.reference_link, target: '_blank', rel: 'noopener noreferrer', text: lead.reference_link }) : lead.reference_link;

    const dialog = h('dialog', { class: 'dialog' },
      h('div', { class: 'dialog__head' },
        h('div', null, h('h3', { text: lead.name }), h('p', { class: 'muted', text: new Date(lead.created_at).toLocaleString() })),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', on: { click: () => dialog.close() } }, icon('close'))),
      h('dl', { class: 'detail' },
        row('Email', h('a', { href: 'mailto:' + lead.email, text: lead.email })),
        row('Phone', lead.phone),
        row('Company', lead.company),
        row('Reason', lead.reason),
        row('Interests', interests.length ? interests.join(', ') : null),
        row('Link', safeLink)),
      h('p', { class: 'field__label', style: 'margin:16px 0 8px', text: 'Message' }),
      h('p', { class: 'detail__msg', text: lead.message }),
      h('div', { class: 'dialog__foot' },
        h('button', { class: 'btn btn--danger btn--sm', type: 'button', on: { click: async () => {
          if (!(await confirmBox('Delete this lead?', 'This cannot be undone.', 'Delete', true))) return;
          try {
            await api('/api/leads?id=' + lead.id, { method: 'DELETE' });
            state.leads = state.leads.filter((l) => l.id !== lead.id);
            dialog.close();
            updateBadge();
            route();
            toast('Lead deleted.');
          } catch (err) { if (err.message !== 'Unauthorised') toast(err.message, true); }
        } } }, icon('trash'), 'Delete'),
        h('button', { class: 'btn btn--glass btn--sm', type: 'button', on: { click: () => { setRead(lead, false); dialog.close(); } } }, 'Mark as unread'),
        h('a', { class: 'btn btn--primary btn--sm', href: 'mailto:' + lead.email + '?subject=' + encodeURIComponent('Re: your message') }, icon('send'), 'Reply')));
    dialog.addEventListener('close', function () {
      dialog.remove();
      if ((location.hash.replace(/^#\/?/, '') || 'overview') === 'leads' || location.hash === '' || location.hash === '#/overview') route();
    });
    document.body.append(dialog);
    dialog.showModal();
  }

  function exportCsv(leads) {
    const cols = ['created_at', 'name', 'email', 'phone', 'company', 'reason', 'interests', 'message', 'reference_link', 'is_read'];
    const cell = (v) => '"' + String(Array.isArray(v) ? v.join(', ') : v ?? '').replace(/"/g, '""') + '"';
    const csv = [cols.join(',')].concat(leads.map((l) => cols.map((c) => cell(l[c])).join(','))).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = h('a', { href: url, download: 'leads-' + new Date().toISOString().slice(0, 10) + '.csv' });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  let leadFilter = 'all';
  let leadSearch = '';

  PAGES.leads = function () {
    const all = state.leads || [];
    const list = h('div', { class: 'leads' });

    function draw() {
      const q = leadSearch.toLowerCase();
      const shown = all.filter((l) =>
        (leadFilter === 'all' || (leadFilter === 'unread' ? !l.is_read : l.is_read)) &&
        (!q || [l.name, l.email, l.company, l.message].join(' ').toLowerCase().includes(q)));
      list.replaceChildren();
      if (state.leads === null) list.append(h('div', { class: 'empty' }, icon('loader'), 'Loading…'));
      else if (!shown.length) list.append(h('div', { class: 'empty' }, icon('inbox'), all.length ? 'No leads match this filter.' : 'No form submissions yet.'));
      else shown.forEach((lead) => list.append(leadRow(lead)));
    }

    const seg = h('div', { class: 'segmented', role: 'tablist' }, [['all', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([id, label]) =>
      h('button', { type: 'button', class: leadFilter === id ? 'is-active' : '', on: { click: (e) => {
        leadFilter = id;
        seg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b === e.currentTarget));
        draw();
      } } }, label)));
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Search name, email or message', value: leadSearch });
    search.addEventListener('input', () => { leadSearch = search.value; draw(); });

    draw();
    return page('Leads', 'Everyone who filled in the contact form on your website.',
      h('div', { class: 'toolbar' }, seg, search,
        h('span', { class: 'topbar__spacer' }),
        h('button', { class: 'btn btn--glass btn--sm', type: 'button', on: { click: () => { state.leads = null; route(); loadLeads(); } } }, icon('refresh'), 'Refresh'),
        h('button', { class: 'btn btn--glass btn--sm', type: 'button', disabled: !all.length, on: { click: () => exportCsv(all) } }, icon('download'), 'Export CSV')),
      list);
  };

  /* --- General settings --- */
  PAGES.settings = function () {
    return page('General', h('span', null, 'Values here are reused across the whole site. Type ', h('code', { text: '{{experience}}' }), ' or ', h('code', { text: '{{teamSize}}' }), ' in any text to insert them.'),
      panel('Your details', 'user', null,
        fields('settings', [
          { key: 'experience', label: 'Years of experience', hint: 'Updates the hero, ticker, about text and stats everywhere.' },
          { key: 'teamSize', label: 'Team size', hint: 'For example 3–5.' },
          { key: 'location', label: 'Location', placeholder: 'Lahore, Pakistan', hint: 'Shown in the hero, menu and contact section. Leave empty to hide.' },
          { key: 'status', label: 'Availability badge', placeholder: 'Open to new opportunities' }
        ])),
      panel('Contact info', 'mail', null,
        fields('settings', [
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+92 300 0000000', hint: 'Leave empty to hide the phone everywhere.' }
        ])),
      panel('Reset content', 'refresh', 'Restore every section to the original text. Your leads and uploaded files are not affected.',
        h('button', { class: 'btn btn--danger btn--sm', type: 'button', on: { click: async () => {
          if (!(await confirmBox('Reset all content?', 'All text goes back to the original version. You can still undo by not saving.', 'Reset', true))) return;
          state.content = clone(SC.DEFAULTS);
          state.open = {};
          changed();
          route();
          toast('Content reset. Click Save to publish, or reload to undo.');
        } } }, icon('refresh'), 'Reset to original')));
  };

  /* --- Contact & social links --- */
  PAGES.socials = function () {
    const options = Object.keys(SC.SOCIALS).map((key) => ({ value: key, label: SC.SOCIALS[key].label }));
    return page('Contact & Social', 'Links shown in the contact section, menu and footer. Drag to change the order.',
      panel('Social links', 'link', null,
        listEditor({
          path: 'socials',
          label: 'link',
          addLabel: 'Add social link',
          title: (item) => item.label || (SC.SOCIALS[item.platform] || SC.SOCIALS.other).label,
          titleIcon: (item) => h('span', { class: 'social-icon', style: 'display:inline-grid;vertical-align:middle;margin-right:10px;width:28px;height:28px' }, socialIcon(item.platform)),
          make: () => ({ platform: 'website', label: '', url: '' }),
          body: (path, onTitle) => h('div', { class: 'fields' },
            field({ path: path + '.platform', label: 'Platform', type: 'select', options, onInput: () => { onTitle(); refreshIcons(); } }),
            field({ path: path + '.label', label: 'Link text', placeholder: 'e.g. LinkedIn', onInput: onTitle }),
            field({ path: path + '.url', label: 'Link', full: true, placeholder: 'https://… (email address or phone number also works)' }))
        })),
      panel('Email & phone', 'mail', h('span', null, 'Edit these under ', h('a', { href: '#/settings', text: 'General' }), '.')));

    function refreshIcons() { setTimeout(route, 0); }
  };

  /* --- Photo & CV --- */
  PAGES.media = function () {
    return page('Photo & CV', 'Upload, replace or remove your hero photo and CV. Click Save to publish.',
      panel('Hero photo', 'image', 'A PNG with a transparent background looks best on the purple arch.',
        fileField({ path: 'settings.heroImage', label: 'Photo', kind: 'image' }),
        h('div', { style: 'margin-top:16px' }, fields('settings', [{ key: 'heroImageAlt', label: 'Photo description (for Google and screen readers)', full: true }]))),
      panel('CV (PDF)', 'file', 'Every “Download CV” button on the site uses this file. Remove it to hide those buttons.',
        fileField({ path: 'settings.cv', label: 'CV file', kind: 'pdf' })));
  };

  /* --- Hero --- */
  PAGES.hero = function () {
    return page('Hero', h('span', null, 'The first screen visitors see. Wrap a word in ', h('code', { text: '[brackets]' }), ' to highlight it in purple.'),
      panel('Headline', 'type', null,
        fields('hero', [
          { key: 'hello', label: 'Greeting line', vars: true },
          { key: 'role', label: 'Role badge' }
        ]),
        h('div', { style: 'margin-top:16px' }, rows({ path: 'hero.titleLines', label: 'Big title (one line per row)', addLabel: 'Add title line', hint: 'Example: [delivered] projects.' })),
        h('div', { style: 'margin-top:16px' }, fields('hero', [
          { key: 'text', label: 'Intro paragraph', type: 'textarea', vars: true },
          { key: 'button', label: 'Main button text' }
        ]))),
      panel('Quick facts under the buttons', 'check', null,
        listEditor({
          path: 'hero.facts', label: 'fact', addLabel: 'Add fact',
          title: (item) => item.text, titleIcon: (item) => icon(item.icon || 'check'),
          make: () => ({ icon: 'check', text: '' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'text', label: 'Text', vars: true, isTitle: true }
          ], onTitle)
        })),
      panel('Photo badges', 'spark', null,
        fields('hero', [
          { key: 'badgeText', label: 'Rotating circle text', full: true, hint: 'Keep it around 45 characters so it fits the circle.' },
          { key: 'flowFrom', label: 'Floating card: from' },
          { key: 'flowTo', label: 'Floating card: to' }
        ])),
      panel('Purple ticker band', 'flow', 'The tilted band that scrolls under the hero.',
        listEditor({
          path: 'ticker', label: 'ticker item', addLabel: 'Add ticker item',
          title: (item) => [item.bold, item.text].filter(Boolean).join(' '),
          make: () => ({ bold: '', text: '' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'bold', label: 'Bold part', vars: true, isTitle: true },
            { key: 'text', label: 'Normal part', isTitle: true }
          ], onTitle)
        })));
  };

  /* --- About --- */
  PAGES.about = function () {
    return page('About & Stats', 'Your story, the stat boxes and the moving tool names.',
      panel('Text', 'user', null,
        fields('about', [
          { key: 'eyebrow', label: 'Small label' },
          { key: 'title', label: 'Title' },
          { key: 'statement', label: 'Big statement (lights up word by word)', type: 'textarea', rows: 4, vars: true }
        ]),
        h('div', { style: 'margin-top:16px' }, rows({ path: 'about.paragraphs', label: 'Paragraphs', multiline: true, addLabel: 'Add paragraph' })),
        h('div', { style: 'margin-top:16px' }, fields('about', [{ key: 'linkText', label: 'Link text (leave empty to hide)', full: true }]))),
      panel('Stat boxes', 'chart', h('span', null, 'Whole numbers count up when they scroll into view. Use ', h('code', { text: '{{experience}}' }), ' to keep it in sync.'),
        listEditor({
          path: 'about.stats', label: 'stat', addLabel: 'Add stat box',
          title: (item) => [item.value, item.label].filter(Boolean).join(' · '),
          make: () => ({ value: '', label: '' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'value', label: 'Number', vars: true, isTitle: true },
            { key: 'label', label: 'Label', isTitle: true }
          ], onTitle)
        })),
      panel('Moving tool names', 'sync', null,
        chips({ path: 'about.toolsRow1', label: 'Top row (moves left)' }),
        h('div', { style: 'margin-top:16px' }, chips({ path: 'about.toolsRow2', label: 'Bottom row (moves right)' }))));
  };

  /* --- Section header fields (shared) --- */
  function headFields(base, withLead) {
    const specs = [{ key: 'eyebrow', label: 'Small label' }, { key: 'title', label: 'Title' }];
    if (withLead) specs.push({ key: 'lead', label: 'Intro text', type: 'textarea', rows: 2, vars: true });
    return panel('Section heading', 'type', null, fields(base, specs));
  }

  /* --- Services --- */
  PAGES.services = function () {
    return page('Services', 'Each service is a row in the accordion. The first one opens by default.',
      headFields('services', true),
      panel('Services', 'layers', null,
        listEditor({
          path: 'services.items', label: 'service', addLabel: 'Add service', openFirst: true,
          title: (item) => item.title,
          make: () => ({ title: 'New service', text: '', points: [] }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'title', label: 'Title', isTitle: true, full: true },
            { key: 'text', label: 'Description', type: 'textarea', vars: true },
            { key: 'points', label: 'Checklist points', type: 'chips' }
          ], onTitle)
        })));
  };

  /* --- Expertise tabs --- */
  PAGES.expertise = function () {
    return page('Expertise Tabs', 'Add, rename or remove tabs, and edit the skills inside each one.',
      headFields('expertise', false),
      panel('Tabs', 'grid', null,
        listEditor({
          path: 'expertise.tabs', label: 'tab', addLabel: 'Add tab', openFirst: true,
          title: (item) => item.name, titleIcon: (item) => icon(item.icon || 'grid'),
          make: () => ({ name: 'New tab', icon: 'grid', intro: '', items: [] }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'name', label: 'Tab name', isTitle: true },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'intro', label: 'Intro line', type: 'textarea', rows: 2 },
            { key: 'items', label: 'Skills', type: 'chips' }
          ], onTitle)
        })));
  };

  /* --- Projects --- */
  PAGES.projects = function () {
    return page('Projects', 'Add screenshots and live links. Projects without a link show “Link coming soon”. Only publish work you have permission to share.',
      headFields('work', true),
      panel('Projects', 'briefcase', null,
        listEditor({
          path: 'work.projects', label: 'project', addLabel: 'Add project', openFirst: true,
          title: (item) => item.title,
          make: () => ({ title: 'New project', tags: [], text: '', role: '', link: '', image: '', accent: '#8a5cc7' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'title', label: 'Project name', isTitle: true },
            { key: 'link', label: 'Live link', type: 'url', placeholder: 'https://' },
            { key: 'tags', label: 'Tags', type: 'chips' },
            { key: 'text', label: 'Description', type: 'textarea' },
            { key: 'role', label: 'My role', type: 'textarea', rows: 2 },
            { key: 'image', label: 'Screenshot', type: 'image', kind: 'image', wide: true, hint: 'Landscape screenshot, around 1600×1000. Without one, a placeholder is shown.' },
            { key: 'accent', label: 'Placeholder colour', type: 'color' }
          ], onTitle)
        })),
      panel('Note under the projects', 'info', null, fields('work', [{ key: 'note', label: 'Text (leave empty to hide)', full: true }])));
  };

  /* --- Process --- */
  PAGES.process = function () {
    return page('Process', 'Steps are numbered automatically in order.',
      headFields('process', true),
      panel('Steps', 'flow', null,
        listEditor({
          path: 'process.steps', label: 'step', addLabel: 'Add step',
          title: (item) => item.title, titleIcon: (item) => icon(item.icon || 'check'),
          make: () => ({ icon: 'check', title: 'New step', text: '' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'title', label: 'Title', isTitle: true },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'text', label: 'Description', type: 'textarea', rows: 2 }
          ], onTitle)
        })));
  };

  /* --- Why me --- */
  PAGES.why = function () {
    return page('Why Me', 'Reasons to work with you, shown as cards.',
      headFields('why', false),
      panel('Cards', 'shield', null,
        listEditor({
          path: 'why.cards', label: 'card', addLabel: 'Add card',
          title: (item) => item.title, titleIcon: (item) => icon(item.icon || 'check'),
          make: () => ({ icon: 'check', title: 'New card', text: '' }),
          body: (path, onTitle) => itemFields(path, [
            { key: 'title', label: 'Title', isTitle: true },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'text', label: 'Description', type: 'textarea', rows: 2 }
          ], onTitle)
        })));
  };

  /* --- Contact, CTA, band & footer --- */
  PAGES.closing = function () {
    return page('Contact & Footer', 'The contact section, the big moving text, the closing purple box and the footer.',
      panel('Contact section', 'mail', null, fields('contact', [
        { key: 'eyebrow', label: 'Small label' },
        { key: 'title', label: 'Title' },
        { key: 'lead', label: 'Intro text', type: 'textarea', rows: 3, vars: true },
        { key: 'formTitle', label: 'Form title' }
      ])),
      panel('Big moving text', 'sync', null, fields('band', [{ key: 'text', label: 'Text', full: true }])),
      panel('Closing purple box', 'spark', null, fields('cta', [
        { key: 'line1', label: 'First line' },
        { key: 'line2', label: 'Second line (lavender)' },
        { key: 'button', label: 'Button text' }
      ])),
      panel('Footer', 'grid', null, fields('footer', [{ key: 'tagline', label: 'Tagline', full: true }])));
  };


  /* 7. Start
     ------------------------------------------------------------------------ */
  (async function boot() {
    if (!SC) {
      root.replaceChildren(h('div', { class: 'boot' }, h('p', { text: 'site-content.js is missing. Upload it next to index.html.' })));
      return;
    }
    try {
      const session = await api('/api/session');
      state.user = session.user;
      await startApp();
    } catch {
      showLogin();
    }
  })();
})();
