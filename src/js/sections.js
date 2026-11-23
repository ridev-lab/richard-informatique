import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { splitWords, finePointer } from './utils.js';

/* ------------------------------------------------------------------ ticker */
export function initTicker(reduced) {
  const rows = [...document.querySelectorAll('.ticker__row')];
  const tweens = rows.map((row) => {
    const track = row.querySelector('.ticker__track');
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    row.append(clone);
    const dir = Number(row.dataset.speed) || 1;
    if (reduced) {
      // pas de boucle automatique : le bandeau ne bouge qu'avec le défilement
      gsap.fromTo(row.children, { xPercent: dir > 0 ? 0 : -60 }, { xPercent: dir > 0 ? -60 : 0, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: true } });
      return null;
    }
    return gsap.fromTo(row.children, { xPercent: dir > 0 ? 0 : -100 }, { xPercent: dir > 0 ? -100 : 0, duration: 38, ease: 'none', repeat: -1 });
  }).filter(Boolean);
  if (!tweens.length) return;
  let boost = 0;
  ScrollTrigger.create({
    trigger: '.ticker',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      boost = Math.min(5, Math.abs(self.getVelocity()) / 350);
      tweens.forEach((t) => gsap.to(t, { timeScale: 1 + boost, duration: 0.25, overwrite: true }));
    },
  });
  // retour à la vitesse normale
  gsap.ticker.add(() => {
    if (boost > 0.01) {
      boost *= 0.92;
      tweens.forEach((t) => t.timeScale(1 + boost));
    }
  });
}

/* ---------------------------------------------------------------- services */
const VIZ_TITLES = ['seo.richard', 'marketing.richard', 'site.richard', 'design.richard', 'perf.richard', 'diag.richard'];

const vizAnims = [
  // 0 — SEO : la requête est tapée, puis votre site grimpe en 1re position
  (el) => {
    const q = el.querySelector('.serp__query');
    const rows = [...el.querySelectorAll('.serp__row')];
    const you = el.querySelector('.serp__row--you');
    const others = rows.filter((r) => r !== you);
    const mark = you.querySelector('mark');
    const gap = rows[0].offsetHeight + (window.innerWidth < 980 ? 6 : 8);
    const text = 'consultant seo landes';
    const o = { n: 0 };
    rows.forEach((r, k) => gsap.set(r, { y: k * gap, autoAlpha: 0 }));
    gsap.set(mark, { autoAlpha: 0, scale: 0.5 });
    q.textContent = '';
    const tl = gsap.timeline();
    tl.to(o, { n: text.length, duration: 1.1, ease: 'none', onUpdate: () => { q.textContent = text.slice(0, Math.round(o.n)); } })
      .to(rows, { autoAlpha: 1, duration: 0.4, stagger: 0.07 }, '+=0.1')
      .to(you, { y: 0, duration: 1.4, ease: 'power3.inOut' }, '+=0.35')
      .to(others, { y: (k) => (k + 1) * gap, duration: 1.4, ease: 'power3.inOut', stagger: 0.04 }, '<')
      .to(mark, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.25');
    return tl;
  },
  // 1 — Marketing : courbe qui monte et indicateurs qui défilent
  (el) => {
    const tl = gsap.timeline();
    tl.fromTo(el.querySelectorAll('.kpi'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 0)
      .fromTo(el.querySelector('.chart__line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0.2)
      .fromTo(el.querySelector('.chart__area'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.9);
    el.querySelectorAll('.kpi strong').forEach((n) => {
      const from = Number(n.dataset.from || 0), to = Number(n.dataset.to), suf = n.dataset.suffix || '';
      const o = { v: from };
      n.textContent = from.toLocaleString('fr-FR') + suf;
      tl.to(o, { v: to, duration: 1.7, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v).toLocaleString('fr-FR') + suf; } }, 0.2);
    });
    return tl;
  },
  // 2 — Site : maquette filaire qui se remplit, puis un clic sur l'appel à l'action
  (el) => {
    const wf = el.querySelector('.wf');
    const parts = [...wf.querySelectorAll('.wf__nav > i, .wf__nav span i, .wf__nav b, .wf__h1, .wf__p, .wf__btn, .wf__img, .wf__cards i')];
    parts.forEach((p) => { p.setAttribute('data-wf', ''); p.classList.remove('is-filled'); });
    wf.classList.add('is-wire');
    const cursor = el.querySelector('.wf__cursor');
    const btn = wf.querySelector('.wf__btn');
    const rel = (node, fx, fy) => {
      const r = node.getBoundingClientRect(), r0 = el.getBoundingClientRect();
      return { x: r.left - r0.left + r.width * fx, y: r.top - r0.top + r.height * fy };
    };
    const tl = gsap.timeline();
    tl.fromTo(parts, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, stagger: 0.035, ease: 'power2.out' }, 0);
    parts.forEach((p, k) => tl.call(() => p.classList.add('is-filled'), null, 1.0 + k * 0.07));
    tl.set(cursor, { autoAlpha: 1, x: () => rel(wf, 0.92, 0.9).x, y: () => rel(wf, 0.92, 0.9).y }, 2.1)
      .to(cursor, { x: () => rel(btn, 0.6, 0.6).x, y: () => rel(btn, 0.6, 0.6).y, duration: 1, ease: 'power3.inOut' }, 2.2)
      .to(btn, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1 }, 3.2)
      .to(cursor, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 }, 3.2);
    gsap.set(cursor, { autoAlpha: 0, scale: 1 });
    return tl;
  },
  // 3 — Design : typo, palette, courbe de Bézier, composant sélectionné
  (el) => {
    const tl = gsap.timeline();
    tl.fromTo(el.querySelectorAll('.ds > *'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 0)
      .fromTo(el.querySelector('.ds__aa'), { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' }, 0.15)
      .fromTo(el.querySelectorAll('.ds__swatches i'), { scale: 0 }, { scale: 1, stagger: 0.07, duration: 0.5, ease: 'back.out(2.5)' }, 0.35)
      .fromTo(el.querySelector('.ds__curve path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.5)
      .fromTo(el.querySelectorAll('.ds__curve line, .ds__curve circle, .ds__curve rect'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.06 }, 1.3)
      .fromTo(el.querySelectorAll('.ds__comp .h, .ds__comp em'), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' }, 1.6);
    return tl;
  },
  // 4 — Performance : jauges à 100
  (el) => {
    const tl = gsap.timeline();
    el.querySelectorAll('.gauge').forEach((g, k) => {
      const n = g.querySelector('strong');
      const o = { v: 0 };
      tl.fromTo(g.querySelector('.g'), { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.out' }, k * 0.12)
        .fromTo(o, { v: 0 }, { v: 100, duration: 1.7, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v); } }, k * 0.12);
    });
    tl.fromTo(el.querySelectorAll('.checks li'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4 }, 1);
    return tl;
  },
  // 5 — Dépannage : terminal tapé ligne par ligne
  (el) => {
    const lines = [...el.querySelectorAll('.term__line')];
    const tl = gsap.timeline();
    gsap.set(lines, { autoAlpha: 0 });
    lines.forEach((l, k) => {
      const at = k === 0 ? 0 : 0.8 + (k - 1) * 0.42;
      tl.set(l, { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' }, at)
        .to(l, { clipPath: 'inset(0 0% 0 0)', duration: k === 0 ? 0.7 : 0.3, ease: 'steps(20)' }, at);
    });
    return tl;
  },
];

export function initServices(reduced) {
  const items = [...document.querySelectorAll('.svc')];
  const panes = [...document.querySelectorAll('.viz')];
  const title = document.querySelector('.stage__title');
  if (!items.length) return;
  let current = -1;
  let anim = null;

  function activate(i) {
    if (i === current) return;
    const prev = panes[current];
    const next = panes[i];
    items.forEach((it, k) => it.classList.toggle('is-active', k === i));
    anim?.kill();
    if (prev) {
      gsap.killTweensOf(prev);
      gsap.to(prev, { autoAlpha: 0, duration: 0.3, onComplete: () => prev.classList.remove('is-active') });
    }
    panes.forEach((p, k) => { if (k !== i && k !== current) { p.classList.remove('is-active'); gsap.set(p, { autoAlpha: 0 }); } });
    next.classList.add('is-active');
    title.textContent = VIZ_TITLES[i];
    current = i;
    gsap.fromTo(next, { autoAlpha: 0, clipPath: 'inset(6% 6% 6% 6% round 18px)' }, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.8, ease: 'power3.out' });
    anim = vizAnims[i](next);
  }

  items.forEach((it, i) => {
    ScrollTrigger.create({
      trigger: it,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => { if (self.isActive) activate(i); },
    });
  });
  // la scène joue sa 1re animation dès qu'elle apparaît
  ScrollTrigger.create({ trigger: '.services__stage', start: 'top 80%', once: true, onEnter: () => { if (current < 0) activate(0); } });
}

/* ------------------------------------------------------------------- stats */
export function initStats(reduced) {
  document.querySelectorAll('.odo').forEach((el) => {
    const val = el.dataset.value;
    const digits = val.split('');
    el.textContent = '';
    el.setAttribute('aria-label', val);
    el.setAttribute('role', 'text');
    const cols = digits.map(() => {
      const wrap = document.createElement('span');
      wrap.className = 'digit';
      wrap.setAttribute('aria-hidden', 'true');
      const col = document.createElement('span');
      col.className = 'digit__col';
      for (let r = 0; r < 20; r += 1) {
        const s = document.createElement('span');
        s.textContent = String(r % 10);
        col.append(s);
      }
      wrap.append(col);
      el.append(wrap);
      return col;
    });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => cols.forEach((col, k) => gsap.fromTo(col, { yPercent: 0 }, { yPercent: -((10 + Number(digits[k])) / 20) * 100, duration: 2 + k * 0.25, delay: k * 0.08, ease: 'power4.out' })),
    });
  });
  gsap.from('.stat', { autoAlpha: 0, y: 40, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 80%', once: true } });
}

/* -------------------------------------------------------------------- work */
export function initWork(reduced) {
  const pin = document.querySelector('.work__pin');
  const track = document.querySelector('.work__track');
  const bar = document.querySelector('.work__progress span');
  const projects = [...document.querySelectorAll('.project')];
  const mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.round(dist() * 0.85)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
    projects.forEach((p) => {
      const media = p.querySelector('.project__media');
      const img = p.querySelector('.browser__view img');
      gsap.fromTo(media, { scale: 0.84, rotate: -3, transformOrigin: '50% 60%' }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'center 60%', scrub: true } });
      if (img) gsap.fromTo(img, { xPercent: 4 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo(p.querySelectorAll('.project__body > *'), { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.07, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 70%', toggleActions: 'play none none reverse' } });
    });
    gsap.fromTo('.work__end > *', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.work__end', containerAnimation: tween, start: 'left 80%', toggleActions: 'play none none reverse' } });
  });
  mm.add('(max-width: 980px)', () => {
    projects.forEach((p) => {
      gsap.fromTo(p.querySelector('.project__media'), { y: 60, autoAlpha: 0, scale: 0.94 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 85%', once: true } });
      gsap.fromTo(p.querySelectorAll('.project__body > *'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: p.querySelector('.project__body'), start: 'top 88%', once: true } });
    });
  });
}

/* ----------------------------------------------------------------- reveals */
export function initReveals() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 112,
          duration: 1.15,
          stagger: 0.09,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' },
        });
      },
    });
  });
  gsap.set('[data-reveal]', { autoAlpha: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });

  // phrase « pourquoi moi » : les mots s'allument au fil du scroll
  document.querySelectorAll('[data-scrub]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.13 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } });
  });
}

/* ------------------------------------------------------------- why cards */
export function initSpotlight() {
  if (!finePointer()) return;
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------------------------------------------------------------- reviews */
export function initReviews() {
  const cards = gsap.utils.toArray('.review');
  const start = [-7, 6, -5, 8];
  const rest = [-1.4, 1.1, -0.7, 1.5];
  gsap.fromTo(cards, { y: 140, rotate: (i) => start[i % 4], autoAlpha: 0 }, {
    y: 0, rotate: (i) => rest[i % 4], autoAlpha: 1, duration: 1.3, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.reviews__deck', start: 'top 82%', once: true },
  });
  const num = document.querySelector('.score__num');
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: '.score',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to('.score__fill', { width: '100%', duration: 1.6, ease: 'power2.inOut', delay: 0.2 });
      gsap.fromTo(o, { v: 0 }, { v: 5, duration: 1.6, ease: 'power2.out', onUpdate: () => { num.textContent = o.v.toFixed(1).replace('.', ','); } });
    },
  });
}

/* ------------------------------------------------------------------ about */
export function initAbout() {
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.map', start: 'top 75%', once: true } });
  tl.fromTo('.map__coast', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
    .fromTo('.map__land', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 0.2)
    .fromTo('.town--home > circle:not(.ripple)', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 0.6)
    .fromTo('.map__links path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out' }, 0.9)
    .fromTo('.town:not(.town--home) circle', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(3)' }, 1.3)
    .fromTo('.town text', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 }, 1.4)
    .fromTo('.map__list li', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04 }, 1.6);
}
