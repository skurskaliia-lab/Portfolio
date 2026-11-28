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
  window.addEventListener('scroll', updateServices, { passive: true });
  window.addEventListener('resize', updateServices);
  updateServices();

})();
