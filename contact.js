(() => {
  const form = document.getElementById('form');

  // Preselect the service when arriving from a Services card (contact.html?service=ecommerce)
  const wanted = new URLSearchParams(location.search).get('service');
  const radio = wanted && form.querySelector(`input[name="service"][value="${CSS.escape(wanted)}"]`);
  if (radio) radio.checked = true;

  form.addEventListener('submit', e => {
    // Placeholder: no backend yet. Set the form's action to a form service to send for real.
    e.preventDefault();
    const fields = [...form.querySelectorAll('[required]')];
    const bad = fields.find(f => !f.checkValidity());
    if (bad) { bad.reportValidity(); bad.focus(); return; }
    form.classList.add('is-sent');
    form.querySelector('.form__done').focus?.();
  });
})();
