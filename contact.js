(() => {
  const form = document.getElementById('form');
  const btn = form.querySelector('.form__submit');
  const err = form.querySelector('.form__error');

  // Preselect the service when arriving from a Services card (contact.html?service=ecommerce)
  const wanted = new URLSearchParams(location.search).get('service');
  const radio = wanted && form.querySelector(`input[name="service"][value="${CSS.escape(wanted)}"]`);
  if (radio) radio.checked = true;

  const configured = !form.action.includes('YOUR_FORM_ID');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = [...form.querySelectorAll('[required]')].find(f => !f.checkValidity());
    if (bad) { bad.reportValidity(); bad.focus(); return; }
    err.hidden = true;

    const data = new FormData(form);
    if (!configured) {
      // No form service yet: hand the message to the visitor's email app.
      const to = form.querySelector('.form__note a').getAttribute('href').replace('mailto:', '');
      const body = `Service: ${data.get('service')}\nBudget: ${data.get('budget') || 'Not sure yet'}\n\n${data.get('message')}\n\n${data.get('name')} (${data.get('email')})`;
      location.href = `mailto:${to}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(body)}`;
      return;
    }

    btn.disabled = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.classList.add('is-sent');
      form.reset();
    } catch {
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
})();
