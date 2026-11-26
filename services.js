(() => {
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
      // Phones (note sits under the cards): starts when the note scrolls into view.
      // Own page: desktop starts at the top of the page.
      const startTop = stacked ? noteEl.getBoundingClientRect().top - r.top - vh * 0.85 : -(r.top + scrollY);
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

})();
