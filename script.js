/* ==========================================================================
   Aisha Ali Muhammad | Portfolio, version 3
   script.js

   1.  Helpers
   2.  Preloader (0 to 100% counter)
   3.  Header (hide on scroll down, show on scroll up)
   4.  Full-screen menu
   5.  Marquees (seamless loops)
   6.  Scroll reveal
   7.  About statement: words light up on scroll
   8.  Count-up numbers
   9.  Services accordion
   10. Expertise tabs
   11. Process timeline progress
   12. Back-to-top progress ring
   13. Placeholder project links
   14. Custom cursor
   15. Magnetic buttons
   16. Lead form + thank-you popup
   17. Footer year

   Everything runs after site-content.js has written the saved content
   into the page (window.__contentReady), so menus, tabs and accordions
   are set up on the final markup.
   ========================================================================== */

(function () {
  'use strict';

  function init() {

    /* 1. Helpers
       ------------------------------------------------------------------------ */
    const $ = function (selector, scope) { return (scope || document).querySelector(selector); };
    const $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Functions that should run on every scroll frame
    const scrollTasks = [];
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        scrollTasks.forEach(function (task) { task(); });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);


    /* 2. Preloader
       Counts to 100%, waits for the page to finish loading, then slides up.
       ------------------------------------------------------------------------ */
    const preloader = $('#preloader');
    const countEl = $('#preloader-count');
    const barEl = $('#preloader-bar');

    function revealPage() {
      document.body.classList.add('is-loaded');
      startRevealObserver();
    }

    if (!preloader || reduceMotion) {
      if (preloader) preloader.remove();
      revealPage();
    } else {
      const duration = 1400;
      const start = performance.now();
      let pageLoaded = document.readyState === 'complete';
      window.addEventListener('load', function () { pageLoaded = true; });

      (function step(now) {
        const t = Math.min((now - start) / duration, 1);
        // Ease out so the count slows down near the end
        const eased = 1 - Math.pow(1 - t, 3);
        // Hold at 99% until the page has really finished loading
        const value = Math.round(eased * (pageLoaded ? 100 : 99));

        countEl.textContent = value;
        barEl.style.width = value + '%';

        if (t < 1 || !pageLoaded) {
          requestAnimationFrame(step);
          return;
        }

        setTimeout(function () {
          preloader.classList.add('is-done');
          revealPage();
          preloader.addEventListener('transitionend', function () { preloader.remove(); }, { once: true });
        }, 250);
      })(start);
    }


    /* 3. Header
       ------------------------------------------------------------------------ */
    const header = $('#site-header');
    let lastY = window.scrollY;

    scrollTasks.push(function () {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 30);
      // Hide only after the hero, and only while scrolling down
      header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6 && !document.body.classList.contains('is-locked'));
      lastY = y;
    });


    /* 4. Full-screen menu
       ------------------------------------------------------------------------ */
    const menu = $('#menu');
    const menuToggle = $('.menu-toggle');
    const menuClose = $('.menu__close');

    function openMenu() {
      menu.hidden = false;
      document.body.classList.add('is-locked');
      menuToggle.setAttribute('aria-expanded', 'true');
      // Next frame, so the opening animation runs
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      });
      setTimeout(function () { $('.menu__nav a', menu).focus(); }, 400);
    }

    function closeMenu(callback) {
      menu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      setTimeout(function () {
        menu.hidden = true;
        document.body.classList.remove('is-locked');
        if (typeof callback === 'function') callback();
      }, 550);
    }

    menuToggle.addEventListener('click', openMenu);
    menuClose.addEventListener('click', function () {
      closeMenu(function () { menuToggle.focus(); });
    });

    // Menu links: close first, then scroll to the section
    $$('[data-menu-link]', menu).forEach(function (link) {
      link.addEventListener('click', function (event) {
        const target = $(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        closeMenu(function () { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) closeMenu(function () { menuToggle.focus(); });
    });


    /* 5. Marquees
       Duplicates the items once, so translating by -50% loops seamlessly.
       ------------------------------------------------------------------------ */
    $$('[data-marquee]').forEach(function (track) {
      Array.from(track.children).forEach(function (item) {
        const copy = item.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      });
    });


    /* 6. Scroll reveal
       Fades up anything with data-animate. Neighbours get a small stagger.
       ------------------------------------------------------------------------ */
    function startRevealObserver() {
      const items = $$('[data-animate]');

      if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); });
        return;
      }

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = $$(':scope > [data-animate]', el.parentElement);
          el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 90 + 'ms';
          el.classList.add('is-in');
          observer.unobserve(el);
          // Clear the delay afterwards so hover effects respond instantly
          setTimeout(function () { el.style.transitionDelay = ''; }, 1500);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      items.forEach(function (el) { observer.observe(el); });
    }


    /* 7. About statement: words light up while scrolling past
       ------------------------------------------------------------------------ */
    const statement = $('[data-words]');

    if (statement) {
      const words = statement.textContent.trim().split(/\s+/);
      statement.innerHTML = words.map(function (word) {
        return '<span class="word">' + word + '</span>';
      }).join(' ');

      const wordEls = $$('.word', statement);

      scrollTasks.push(function () {
        const box = statement.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the top reaches 85% of the screen, 1 when the bottom reaches 45%
        const progress = (vh * 0.85 - box.top) / (box.height + vh * 0.4);
        const lit = Math.round(Math.max(0, Math.min(1, progress)) * wordEls.length);
        wordEls.forEach(function (el, i) { el.classList.toggle('is-lit', i < lit); });
      });
    }


    /* 8. Count-up numbers (elements with data-count)
       ------------------------------------------------------------------------ */
    const counters = $$('[data-count]');

    if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
      const countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count);
          const start = performance.now();
          countObserver.unobserve(el);

          (function tick(now) {
            const t = Math.min((now - start) / 1200, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(tick);
          })(start);
        });
      }, { threshold: 0.6 });

      counters.forEach(function (el) {
        el.textContent = '0';
        countObserver.observe(el);
      });
    }


    /* 9. Services accordion (one row open at a time)
       ------------------------------------------------------------------------ */
    const services = $$('.service');

    function setService(item, open) {
      item.classList.toggle('is-open', open);
      $('.service__head', item).setAttribute('aria-expanded', String(open));
    }

    services.forEach(function (item) {
      const head = $('.service__head', item);
      setService(item, head.getAttribute('aria-expanded') === 'true');

      head.addEventListener('click', function () {
        const willOpen = !item.classList.contains('is-open');
        services.forEach(function (other) { setService(other, false); });
        setService(item, willOpen);
      });
    });


    /* 10. Expertise tabs (click or use the arrow keys)
       ------------------------------------------------------------------------ */
    const tabs = $$('.tabs__tab');

    function selectTab(tab) {
      tabs.forEach(function (t) {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !selected;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { selectTab(tab); });
      tab.addEventListener('keydown', function (event) {
        let next = null;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (next) {
          event.preventDefault();
          next.focus();
          selectTab(next);
        }
      });
    });


    /* 11. Process timeline
       The violet line grows with scroll; steps above the middle of the
       screen are marked active.
       ------------------------------------------------------------------------ */
    const timeline = $('#timeline');

    if (timeline) {
      const line = $('.timeline__line', timeline);
      const steps = $$('.timeline__step', timeline);

      scrollTasks.push(function () {
        const box = line.getBoundingClientRect();
        const middle = window.innerHeight * 0.55;
        const progress = Math.max(0, Math.min(1, (middle - box.top) / box.height));
        line.style.setProperty('--progress', progress.toFixed(3));

        steps.forEach(function (step) {
          const icon = $('.timeline__icon', step).getBoundingClientRect();
          step.classList.toggle('is-active', icon.top + icon.height / 2 < middle);
        });
      });
    }


    /* 12. Back-to-top progress ring
       ------------------------------------------------------------------------ */
    const toTop = $('.to-top');

    if (toTop) {
      scrollTasks.push(function () {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        toTop.style.setProperty('--scroll', max > 0 ? (window.scrollY / max).toFixed(3) : 0);
      });
    }

    // Run all scroll tasks once on load
    onScroll();


    /* 13. Placeholder project links
       While href is still "#", the button shows "Link coming soon" and does
       nothing. Add the real URL and it works automatically.
       ------------------------------------------------------------------------ */
    $$('[data-placeholder-link]').forEach(function (link) {
      if (link.getAttribute('href') !== '#') return;
      link.classList.add('is-pending');
      link.setAttribute('aria-disabled', 'true');
      link.removeAttribute('target');
      link.removeAttribute('data-cursor');
      $('span', link).textContent = 'Link coming soon';
      link.addEventListener('click', function (event) { event.preventDefault(); });
    });


    /* 14. Custom cursor (mouse/trackpad only)
       The dot follows exactly, the ring follows with a slight delay.
       ------------------------------------------------------------------------ */
    const cursor = $('.cursor');

    if (cursor && finePointer && !reduceMotion) {
      const dot = $('.cursor__dot', cursor);
      const ring = $('.cursor__ring', cursor);
      let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

      document.addEventListener('pointermove', function (event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        dot.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px)';
        cursor.classList.add('is-active');

        const target = event.target.closest('a, button, label, [data-cursor]');
        const mode = target ? (target.dataset.cursor || 'hover') : '';
        cursor.classList.toggle('is-view', mode === 'view');
        cursor.classList.toggle('is-hover', mode === 'hover');
      });

      document.addEventListener('pointerleave', function () { cursor.classList.remove('is-active'); });

      (function follow() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px)';
        requestAnimationFrame(follow);
      })();
    }


    /* 15. Magnetic buttons
       Buttons with the "magnetic" class lean towards the cursor.
       ------------------------------------------------------------------------ */
    if (finePointer && !reduceMotion) {
      $$('.magnetic').forEach(function (el) {
        el.addEventListener('pointermove', function (event) {
          const box = el.getBoundingClientRect();
          const x = event.clientX - box.left - box.width / 2;
          const y = event.clientY - box.top - box.height / 2;
          el.style.transform = 'translate(' + x * 0.25 + 'px, ' + y * 0.35 + 'px)';
        });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      });
    }


    /* 16. Lead form + thank-you popup
       Validates the form, saves it through /api/leads (your database),
       then shows the popup. New leads appear in the dashboard.
       ------------------------------------------------------------------------ */
    const form = $('#lead-form');
    const thanks = $('#thanks');

    if (form) {
      const statusEl = $('.lead-form__status', form);
      const submitBtn = $('button[type="submit"]', form);
      const submitLabel = $('.btn__label', submitBtn);
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      // Each rule returns an error message, or "" when the value is fine
      const rules = {
        'lead-reason': function () {
          return form.querySelector('input[name="reason"]:checked') ? '' : 'Please choose one option.';
        },
        'lead-name': function (value) {
          return value.length < 2 ? 'Please enter your name.' : '';
        },
        'lead-email': function (value) {
          if (!value) return 'Please enter your email address.';
          return emailPattern.test(value) ? '' : 'Please enter a valid email address.';
        },
        'lead-message': function (value) {
          return value.length < 10 ? 'Please write a short message (10+ characters).' : '';
        },
        'lead-link': function (value) {
          if (!value) return '';
          return /^https?:\/\/\S+\.\S+/.test(value) ? '' : 'Please enter a full link starting with https://';
        }
      };

      function check(id) {
        const field = document.getElementById(id);
        const value = field && field.value !== undefined ? field.value.trim() : '';
        const message = rules[id](value);
        const wrapper = field.closest('.field');
        const errorEl = document.getElementById(id + '-error');

        wrapper.classList.toggle('has-error', Boolean(message));
        if (errorEl) errorEl.textContent = message;
        if (field.matches('input, textarea')) {
          field.setAttribute('aria-invalid', message ? 'true' : 'false');
          if (errorEl) field.setAttribute('aria-describedby', errorEl.id);
        }
        return !message;
      }

      function setStatus(message, isError) {
        statusEl.textContent = message;
        statusEl.className = 'lead-form__status' + (isError ? ' is-error' : '');
      }

      function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('is-loading', isLoading);
        submitLabel.textContent = isLoading ? 'Sending...' : 'Send details';
      }

      // Re-check a field once the visitor starts fixing it
      form.addEventListener('input', function (event) {
        const wrapper = event.target.closest('.field.has-error');
        if (!wrapper) return;
        const id = event.target.name === 'reason' ? 'lead-reason' : event.target.id;
        if (rules[id]) check(id);
      });

      form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const invalid = Object.keys(rules).filter(function (id) { return !check(id); });
        if (invalid.length) {
          const first = document.getElementById(invalid[0]);
          (first.matches('input, textarea') ? first : $('input', first)).focus();
          setStatus('Please fix the highlighted fields.', true);
          return;
        }

        setLoading(true);
        setStatus('', false);

        // Turn the form into JSON (checkboxes become a list)
        const data = new FormData(form);
        const payload = {};
        data.forEach(function (value, key) {
          if (key === 'interests') (payload.interests = payload.interests || []).push(value);
          else payload[key] = value;
        });

        try {
          const response = await fetch(form.getAttribute('action'), {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
          });

          if (response.ok) {
            form.reset();
            if (thanks && typeof thanks.showModal === 'function') {
              thanks.showModal();
            } else {
              setStatus('Thank you! Your message has been sent.', false);
            }
          } else {
            const result = await response.json().catch(function () { return {}; });
            setStatus((result.error || 'Something went wrong.') + ' Please try again or email me directly.', true);
          }
        } catch (error) {
          setStatus('Network error. Please check your connection or email me directly.', true);
        } finally {
          setLoading(false);
        }
      });
    }

    if (thanks) {
      $$('[data-close-thanks]', thanks).forEach(function (el) {
        el.addEventListener('click', function () { thanks.close(); });
      });
      // Clicking the dark backdrop also closes the popup
      thanks.addEventListener('click', function (event) {
        if (event.target !== thanks) return;
        const box = thanks.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right ||
                        event.clientY < box.top || event.clientY > box.bottom;
        if (outside) thanks.close();
      });
    }


    /* 17. Footer year
       ------------------------------------------------------------------------ */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

  } // end init

  (window.__contentReady || Promise.resolve()).then(init);
})();
