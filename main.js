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
  /* Distance the track travels: from the first visible card centred to the last one centred */
  const distance = () => {
    const visible = cards.filter(c => !c.hidden);
    if (!visible.length) return 0;
    const first = visible[0], last = visible[visible.length - 1];
    return (last.offsetLeft + last.offsetWidth / 2) - (first.offsetLeft + first.offsetWidth / 2);
  };

  if (!window.gsap || !window.ScrollTrigger) {
    // Fallback without GSAP: still vertical scroll -> horizontal movement.
    // The section sticks to the top while a taller wrapper scrolls past it.
    document.documentElement.classList.add('is-sticky-works');
    const wrap = document.createElement('div');
    wrap.className = 'works-scroller';
    works.parentNode.insertBefore(wrap, works);
    wrap.appendChild(works);
    const layout = () => { wrap.style.height = (works.offsetHeight + distance()) + 'px'; move(); };
    const move = () => {
      const d = distance();
      const p = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / Math.max(1, d)));
      track.style.transform = `translate3d(${-p * d}px,0,0)`;
      updateCards();
    };
    window.addEventListener('scroll', move, { passive: true });
    window.addEventListener('resize', layout);
    filters.forEach(b => b.addEventListener('click', () => { layout(); window.scrollTo(0, wrap.offsetTop); }));
    layout();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('is-gsap');

  /* ---------- Hero: slide up with progressive blur ---------- */
  // Slide runs over the whole hero; blur and fade stay off for the first half,
  // then ramp up steeply (power3.in) so the hero stays sharp longer.
  if (!reduce) {
    const heroTl = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
    });
    // blur zone starts 5rem (80px) of scroll earlier than the 35% mark, ending at the same point
    const extra = (5 * parseFloat(getComputedStyle(document.documentElement).fontSize)) / document.querySelector('.hero').offsetHeight;
    heroTl
      .fromTo('.hero__inner', { yPercent: 0 }, { yPercent: -22, ease: 'none', duration: 1 }, 0)
      .fromTo('.hero__inner', { filter: 'blur(0px)' }, { filter: 'blur(18px)', ease: 'power2.in', duration: 0.62 + extra }, 0.35 - extra)
      .fromTo('.hero__inner', { opacity: 1 }, { opacity: 0, ease: 'power2.in', duration: 0.55 }, 0.42);
  }

  /* ---------- Works: vertical scroll drives horizontal track ---------- */
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      id: 'works',
      trigger: works,
      start: 'top top',
      end: () => '+=' + distance(),
      pin: true,
      scrub: reduce ? true : 0.8,
      invalidateOnRefresh: true,
      snap: reduce ? false : {
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
  const sections = ['#top', '#works'].map(id => document.querySelector(id)).filter(Boolean);
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
