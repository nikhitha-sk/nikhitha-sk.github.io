(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Theme toggle (light by default) ---------- */
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Background spotlight + card spotlights ---------- */
  if (!reduceMotion && finePointer) {
    let raf = null, mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', mx + 'px');
        root.style.setProperty('--my', my + 'px');
        raf = null;
      });
    }, { passive: true });

    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--x');
        card.style.removeProperty('--y');
      });
    });
  }

  /* ---------- Typing rotator ---------- */
  const words = ['real-time apps.', 'data pipelines.', 'RAG & LLM systems.', 'scalable microservices.', 'dashboards people use.'];
  const rot = document.getElementById('rotText');
  if (rot) {
    if (reduceMotion) {
      rot.textContent = words[0];
    } else {
      let i = 0, n = 0, del = false;
      rot.textContent = '';
      const tick = () => {
        const w = words[i];
        n += del ? -1 : 1;
        rot.textContent = w.slice(0, n);
        let wait = del ? 40 : 80;
        if (!del && n === w.length) { del = true; wait = 1900; }
        else if (del && n === 0) { del = false; i = (i + 1) % words.length; wait = 350; }
        setTimeout(tick, wait);
      };
      setTimeout(tick, 900);
    }
  }

  /* ---------- Navbar: shrink, progress, active indicator ---------- */
  const navbar = document.getElementById('navbar');
  const bar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');
  const navLinks = Array.from(document.querySelectorAll('#nav a'));
  const indicator = document.getElementById('navIndicator');
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
  const timeline = document.getElementById('timeline');

  const moveIndicator = (link) => {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = '0'; return; }
    indicator.style.left = link.offsetLeft + 'px';
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.opacity = '1';
  };

  let current = -2;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    navbar.classList.toggle('scrolled', y > 20);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (toTop) toTop.classList.toggle('show', y > 700);

    // active section
    const probe = y + window.innerHeight * 0.35;
    let idx = -1;
    sections.forEach((s, k) => { if (s && s.offsetTop <= probe) idx = k; });
    if (y >= max - 4) idx = sections.length - 1;
    if (idx !== current) {
      current = idx;
      navLinks.forEach((a, k) => a.classList.toggle('active', k === idx));
      moveIndicator(navLinks[idx]);
    }

    // timeline line draws as you scroll
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = (window.innerHeight * 0.8 - r.top) / r.height;
      timeline.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { current = -2; onScroll(); });
  onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { current = -2; onScroll(); });

  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Staggered scroll reveal ---------- */
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  // stagger siblings that share a parent
  const groups = new Map();
  reveals.forEach((el) => {
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  });
  groups.forEach((list) => list.forEach((el, k) => el.style.setProperty('--stagger', Math.min(k, 6) * 110 + 'ms')));

  const settle = (el) => {
    el.addEventListener('transitionend', function done(ev) {
      if (ev.propertyName !== 'opacity') return;
      el.classList.add('settled');
      el.style.removeProperty('--stagger');
      el.removeEventListener('transitionend', done);
    });
  };

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          settle(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in', 'settled'));
  }

  /* ---------- Count-up stats ---------- */
  const animateNum = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { animateNum(en.target); nio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-num[data-count]').forEach((el) => nio.observe(el));
  }

  /* ---------- Project filter with sliding pill ---------- */
  const filters = Array.from(document.querySelectorAll('.filter'));
  const fInd = document.getElementById('filterIndicator');
  const projects = document.querySelectorAll('.project');
  const placePill = (btn) => {
    if (!fInd || !btn) return;
    fInd.style.left = btn.offsetLeft + 'px';
    fInd.style.width = btn.offsetWidth + 'px';
  };
  placePill(filters[0]);
  window.addEventListener('resize', () => placePill(document.querySelector('.filter.active')));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placePill(document.querySelector('.filter.active')));

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      placePill(btn);
      const grid = document.getElementById('projectGrid');
      if (grid) grid.dataset.view = f;
      let k = 0;
      projects.forEach((p) => {
        const show = f === 'all' || (p.dataset.cat || '').split(' ').includes(f);
        p.classList.toggle('is-hidden', !show);
        p.classList.remove('pop');
        if (show) {
          p.classList.add('in', 'settled');
          void p.offsetWidth; // restart animation
          p.style.animationDelay = (k++ * 70) + 'ms';
          p.classList.add('pop');
        }
      });
    });
  });

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById('copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const label = copyBtn.querySelector('span');
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.email);
        label.textContent = 'Copied ✓';
      } catch (e) {
        label.textContent = copyBtn.dataset.email;
      }
      setTimeout(() => { label.textContent = 'Copy email'; }, 2000);
    });
  }
})();
