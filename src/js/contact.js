import { gsap } from 'gsap';

const ENDPOINT = 'https://formsubmit.co/ajax/contact@richard-informatique.com';
const MAIL = 'contact@richard-informatique.com';
const LABELS = ['Votre besoin', 'Votre projet', 'Vos coordonnées'];

export function initContact() {
  const form = document.querySelector('.form');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const dots = [...form.querySelectorAll('.form__steps span')];
  const status = form.querySelector('.form__status');
  const error = form.querySelector('.form__error');
  const prev = form.querySelector('[data-prev]');
  const next = form.querySelector('[data-next]');
  const nextLabel = next.querySelector('span');
  const done = form.querySelector('.form__done');
  let step = 1;

  const val = (name) => (form.elements[name]?.value || '').trim();
  const checked = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';

  function showError(msg) {
    error.textContent = msg;
    error.hidden = !msg;
    if (msg) gsap.fromTo(error, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  }

  function show(n, dir = 1) {
    step = n;
    steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; s.classList.toggle('is-active', Number(s.dataset.step) === n); });
    dots.forEach((d, k) => { d.classList.toggle('is-on', k === n - 1); d.classList.toggle('is-done', k < n - 1); });
    status.textContent = `Étape ${n}/3 — ${LABELS[n - 1]}`;
    prev.hidden = n === 1;
    nextLabel.textContent = n === 3 ? 'Envoyer' : 'Continuer';
    showError('');
    gsap.fromTo(steps[n - 1], { autoAlpha: 0, x: 40 * dir }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' });
    const focusable = steps[n - 1].querySelector('textarea, input:not([type="radio"])');
    if (focusable && n > 1) setTimeout(() => focusable.focus({ preventScroll: true }), 250);
  }

  function validate(n) {
    if (n === 1 && !checked('service')) return 'Choisissez le service qui vous intéresse.';
    if (n === 2 && val('message').length < 10) return 'Dites-m’en un peu plus sur votre projet (10 caractères minimum).';
    if (n === 3) {
      if (!val('nom')) return 'Indiquez votre nom.';
      const email = form.elements.email;
      if (!val('email') || !email.checkValidity()) return 'Indiquez une adresse e-mail valide.';
    }
    return '';
  }

  async function submit() {
    showError('');
    if (val('_honey')) { finish(); return; }
    next.disabled = true;
    nextLabel.textContent = 'Envoi…';
    const service = checked('service');
    const data = new FormData();
    data.append('_subject', `Nouvelle demande — ${service} — Richard Informatique`);
    data.append('_template', 'table');
    data.append('_captcha', 'false');
    data.append('service', service);
    data.append('urgence', checked('urgence'));
    data.append('message', val('message'));
    data.append('nom', val('nom'));
    data.append('telephone', val('telephone'));
    data.append('email', val('email'));
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === 'false' || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
      finish();
    } catch {
      // repli : on ouvre la messagerie avec le message prérempli
      const body = `Service : ${service}\nDélai : ${checked('urgence')}\n\n${val('message')}\n\n${val('nom')}\n${val('telephone')}\n${val('email')}`;
      window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(`Demande — ${service}`)}&body=${encodeURIComponent(body)}`;
      next.disabled = false;
      nextLabel.textContent = 'Envoyer';
      showError('L’envoi direct n’a pas fonctionné : votre messagerie s’ouvre avec le message prérempli. Vous pouvez aussi appeler le 06 17 67 78 15.');
    }
  }

  function finish() {
    steps.forEach((s) => { s.hidden = true; });
    form.querySelector('.form__nav').hidden = true;
    form.querySelector('.form__steps').hidden = true;
    status.textContent = 'Demande envoyée';
    done.hidden = false;
    const tl = gsap.timeline();
    tl.fromTo(done, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .fromTo(done.querySelectorAll('svg circle, svg path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.25, ease: 'power2.out' }, 0.1);
  }

  next.addEventListener('click', () => {
    const err = validate(step);
    if (err) { showError(err); return; }
    if (step < 3) show(step + 1, 1);
    else submit();
  });
  prev.addEventListener('click', () => { if (step > 1) show(step - 1, -1); });
  form.addEventListener('submit', (e) => { e.preventDefault(); next.click(); });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next.click(); }
  });
  // un clic sur un service passe directement à l'étape suivante quand le délai est déjà choisi
  form.querySelectorAll('input[name="service"]').forEach((r) => r.addEventListener('change', () => showError('')));
}
