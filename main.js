(() => {
  const works = document.querySelector('.works');
  const track = document.querySelector('.works__track');
  const cards = [...document.querySelectorAll('.work')];
  const filters = [...document.querySelectorAll('.filter')];
  const countEl = document.querySelector('.works__num');

  /* ---------- Filters ---------- */
  const pad = n => String(n).padStart(2, '0');
  filters.forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === 'all' ? cards.length : cards.filter(c => c.dataset.cat === f).length;
    btn.querySelector('sup').textContent = n;
  });

  function applyFilter(f) {
    let i = 0;
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.cat === f;
      c.hidden = !show;
      if (show) c.querySelector('.work__idx').textContent = pad(++i);
    });
    countEl.textContent = pad(i);
    filters.forEach(b => b.classList.toggle('is-active', b.dataset.filter === f));
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
      // jump back to the first card of the filtered list
      const st = ScrollTrigger.getById('works');
      if (st) window.scrollTo({ top: st.start, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
      updateCards();
    } else {
      document.querySelector('.works__viewport').scrollLeft = 0;
    }
  }
  filters.forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

  /* ---------- Card depth: center card full size, neighbours shrink ---------- */
  function updateCards() {
    const mid = window.innerWidth / 2;
    cards.forEach(c => {
      if (c.hidden) return;
      const r = c.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - mid) / (r.width + 40);
      const d = Math.min(Math.abs(dx), 1.5);
      const scale = 1 - Math.min(d, 1) * 0.3;
      const rot = Math.max(-1, Math.min(1, dx)) * -6;
      const m = c.querySelector('.work__media');
      // shrink toward the active card so neighbours peek in, like a carousel
      m.style.transformOrigin = dx > 0 ? 'left center' : 'right center';
      m.style.transform = `perspective(1600px) rotateY(${rot}deg) scale(${scale})`;
      const o = Math.max(0, 1 - d * 1.6);
      c.querySelector('.work__title').style.opacity = o;
      c.querySelector('.work__meta').style.opacity = o;
    });
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Services: covered cards shrink a little and dim ---------- */
  const services = [...document.querySelectorAll('.service')];
  function updateServices() {
    services.forEach((card, i) => {
      let depth = 0;
      for (let k = i + 1; k < services.length; k++) {
        const next = services[k];
        const gap = next.getBoundingClientRect().top - card.getBoundingClientRect().top;
        // 0 when the next card is a full card-height away, 1 once it sits on top
        depth += Math.min(1, Math.max(0, 1 - (gap - 22 * (k - i)) / card.offsetHeight));
      }
      card.style.transform = reduce ? '' : `scale(${(1 - depth * 0.03).toFixed(4)})`;
      card.classList.toggle('is-covered', depth > 0.6);
    });
  }
  /* ---------- Handwritten note: "written" across the Services section ---------- */
  const servicesEl = document.querySelector('.services');
  const noteEl = document.querySelector('.note');
  const noteLines = [...document.querySelectorAll('.note__line')];
  const doodle = document.querySelector('.note__doodle');
  const notePill = document.querySelector('.note__pill');
  const totalChars = noteLines.reduce((n, l) => n + l.textContent.length, 0);
  const clamp01 = v => Math.min(1, Math.max(0, v));
  function updateNote() {
    if (!servicesEl) return;
    let p = 1;
    if (!reduce) {
      const r = servicesEl.getBoundingClientRect(), vh = innerHeight;
      const stacked = getComputedStyle(noteEl).position !== 'sticky';
      // Desktop: starts when the section top reaches 60% of the screen.
      // Phones (note sits under the cards): starts when the note scrolls into view.
      const startTop = stacked ? noteEl.getBoundingClientRect().top - r.top - vh * 0.85 : -vh * 0.6;
      // ends when the section bottom reaches the screen bottom
      const endTop = vh - r.height;
      p = clamp01((startTop + r.top < 0 ? (-r.top - startTop) : 0) / (-endTop - startTop));
    }
    const textP = clamp01(p / 0.8);           // first 80%: the words
    let done = textP * totalChars;
    noteLines.forEach(l => {
      const len = l.textContent.length;
      l.style.setProperty('--p', clamp01(done / len).toFixed(3));
      done -= len;
    });
    doodle.style.setProperty('--d', clamp01((p - 0.8) / 0.12).toFixed(3));  // then the arrow
    notePill.style.setProperty('--o', clamp01((p - 0.9) / 0.1).toFixed(3)); // then the button
  }
  doodle.querySelectorAll('path').forEach(path => path.setAttribute('pathLength', '1'));
  window.addEventListener('scroll', updateNote, { passive: true });
  window.addEventListener('resize', updateNote);
  updateNote();

  window.addEventListener('scroll', updateServices, { passive: true });
  window.addEventListener('resize', updateServices);
  updateServices();

  /* ---------- Social pills lean toward the cursor ---------- */
  const pills = [...document.querySelectorAll('.socials a')];
  if (!reduce) {
    const RANGE = 90, PULL = 0.32;
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      pills.forEach(a => {
        const r = a.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        const k = d < RANGE ? (1 - d / RANGE) * PULL : 0;
        a.style.translate = `${(dx * k).toFixed(1)}px ${(dy * k).toFixed(1)}px`;
      });
    }, { passive: true });
  }
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    // Native horizontal swipe fallback
    const vp = document.querySelector('.works__viewport');
    vp.addEventListener('scroll', updateCards, { passive: true });
    window.addEventListener('resize', updateCards);
    updateCards();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('is-gsap');

  /* ---------- Hero: slide up with progressive blur ---------- */
  gsap.to('.hero__inner', {
    yPercent: -22,
    opacity: 0,
    filter: 'blur(18px)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    },
  });

  /* ---------- Works: vertical scroll drives horizontal track ---------- */
  const distance = () => {
    const visible = cards.filter(c => !c.hidden);
    if (!visible.length) return 0;
    const first = visible[0], last = visible[visible.length - 1];
    return (last.offsetLeft + last.offsetWidth / 2) - (first.offsetLeft + first.offsetWidth / 2);
  };

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      id: 'works',
      trigger: works,
      start: 'top top',
      end: () => '+=' + distance(),
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      snap: {
        snapTo: v => {
          const n = cards.filter(c => !c.hidden).length - 1;
          return n > 0 ? Math.round(v * n) / n : 0;
        },
        inertia: false,
        duration: { min: 0.2, max: 0.5 },
        ease: 'power2.out',
      },
      onRefresh: updateCards,
    },
  });

  /* ---------- Nav: highlight the section in view ---------- */
  const links = [...document.querySelectorAll('.nav__link')];
  const setActive = hash => links.forEach(l => {
    const on = l.getAttribute('href') === hash;
    l.classList.toggle('is-active', on);
    on ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current');
  });
  const sections = ['#top', '#works', '#services'].map(id => document.querySelector(id)).filter(Boolean);
  const pickActive = () => {
    let current = '#top';
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.5) current = '#' + s.id; });
    setActive(current);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pickActive });
  pickActive();

  gsap.ticker.add(updateCards);
  updateCards();
})();
