import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { finePointer, wait } from './utils.js';

/* --------------------------------------------------------------- preloader */
export async function runPreloader({ reduced, ready, onReveal }) {
  const el = document.querySelector('.preloader');
  if (!el) {
    el?.remove();
    await ready;
    onReveal?.();
    return;
  }
  const num = el.querySelector('.preloader__num');
  const bar = el.querySelector('.preloader__bar span');
  const c = { v: 0 };
  const render = () => {
    num.textContent = String(Math.round(c.v)).padStart(3, '0');
    gsap.set(bar, { scaleX: c.v / 100 });
  };
  gsap.timeline()
    .to(el.querySelector('.preloader__logo'), { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
    .to(el.querySelectorAll('.preloader__word span'), { y: 0, yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.35)
    .to(el.querySelector('.preloader__logo'), { fill: '#ff5b23', duration: 0.5 }, 1.3);
  gsap.to(c, { v: 82, duration: 1.3, ease: 'power1.out', onUpdate: render });
  await Promise.race([Promise.all([ready, wait(1500)]), wait(7000)]);
  await gsap.to(c, { v: 100, duration: 0.45, ease: 'power2.out', onUpdate: render });
  const out = gsap.timeline();
  out.to(el.querySelector('.preloader__mark'), { yPercent: -40, autoAlpha: 0, duration: 0.55, ease: 'power3.in' })
    .to(el.querySelector('.preloader__foot'), { autoAlpha: 0, duration: 0.3 }, 0)
    .add(() => onReveal?.(), '-=0.1')
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'power4.inOut' }, '-=0.15');
  await out;
  el.remove();
}

/* ------------------------------------------------------------------ cursor */
export function initCursor(reduced) {
  if (!finePointer()) return;
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;
  root.classList.add('has-cursor');
  const ring = cursor.querySelector('.cursor__ring');
  const dot = cursor.querySelector('.cursor__dot');
  const label = cursor.querySelector('.cursor__label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
  gsap.set(cursor, { autoAlpha: 0 });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    gsap.to(cursor, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, label, [role="button"]');
    const lab = t?.closest('[data-cursor]')?.dataset.cursor;
    cursor.classList.toggle('is-label', !!lab);
    cursor.classList.toggle('is-link', !lab && !!t);
    if (lab) label.textContent = lab;
  });
  document.addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.8, duration: 0.15 }));
  document.addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' }));
}

/* ---------------------------------------------------------------- magnetic */
export function initMagnetic(reduced) {
  if (!finePointer()) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    const k = el.classList.contains('orb') ? 0.35 : 0.25;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * k);
      yTo((e.clientY - (r.top + r.height / 2)) * k);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* --------------------------------------------------------------------- nav */
export function initNav(smooth) {
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const menu = document.getElementById('menu');

  // liens d'ancre → défilement doux
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    const hash = a.getAttribute('href').replace(/^\//, '');
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (menu && !menu.hidden) closeMenu();
    smooth.scrollTo(hash === '#accueil' ? 0 : target);
    history.replaceState(null, '', hash === '#accueil' ? location.pathname : hash);
  });

  function openMenu() {
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    smooth.stop();
    gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power4.inOut' });
    gsap.fromTo(menu.querySelectorAll('li, .menu__phone'), { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out', delay: 0.25 });
  }
  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    smooth.start();
    gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.55, ease: 'power4.inOut', onComplete: () => { menu.hidden = true; } });
  }
  burger?.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) closeMenu(); });

  // nav claire sur les sections claires
  document.querySelectorAll('[data-theme="light"]').forEach((sec) => {
    ScrollTrigger.create({ trigger: sec, start: 'top 44px', end: 'bottom 44px', toggleClass: { targets: nav, className: 'on-light' } });
  });

  // lien courant
  const links = [...document.querySelectorAll('.nav__links a')];
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (self) => a.classList.toggle('is-current', self.isActive) });
  });

  // barre de progression
  gsap.to('.scroll-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/* ------------------------------------------------------------------ footer */
export function initFooter(smooth, reduced) {
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }
  document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = String(new Date().getFullYear()); });
  document.querySelector('[data-top]')?.addEventListener('click', () => smooth.scrollTo(0));
  const letters = document.querySelectorAll('.footer__word span');
  if (letters.length) {
    gsap.fromTo(letters, { yPercent: 105 }, { yPercent: 0, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: 0.8 } });
  }
}

/* ----------------------------------------------------------------- consent */
const KEY = 'ri-consent';
const GA_ID = 'G-VVS7XMTNWL';
const readChoice = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const saveChoice = (v) => { try { localStorage.setItem(KEY, v); } catch { /* stockage indisponible */ } };

function loadAnalytics() {
  if (window.__riGa) return;
  window.__riGa = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

export function initConsent() {
  const box = document.querySelector('.consent');
  if (!box) return;
  const show = () => {
    box.hidden = false;
    gsap.fromTo(box, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' });
  };
  const hide = () => gsap.to(box, { y: 20, autoAlpha: 0, duration: 0.4, onComplete: () => { box.hidden = true; } });
  const choice = readChoice();
  if (choice === 'accept') loadAnalytics();
  else if (!choice) setTimeout(show, 1600);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const v = b.dataset.consent;
    saveChoice(v);
    if (v === 'accept') loadAnalytics();
    hide();
  });
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', show));
}
