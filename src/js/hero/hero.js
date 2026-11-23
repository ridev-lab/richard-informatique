import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHeroScene } from './scene.js';
import { splitWords } from '../utils.js';

const LABELS = ['Signal', 'Bruit', 'Réseau', 'Croissance', 'Système'];

export function initHero({ reduced }) {
  const hero = document.querySelector('.hero');
  const canvas = hero.querySelector('.hero__gl');
  let sc = null;
  try {
    sc = createHeroScene(canvas, { reduced });
  } catch (err) {
    console.warn('[hero] WebGL indisponible', err);
  }
  if (!sc) {
    document.documentElement.classList.add('no-webgl');
    canvas.remove();
  }

  const state = sc ? sc.state : { progress: 0, rotY: 0, rotX: 0, x: 0, y: 0, camZ: 11, opacity: 1, intro: 1 };
  if (sc) {
    gsap.ticker.add(() => sc.frame(performance.now()));
  }

  const glow = hero.querySelector('.hero__glow');
  const statements = [...hero.querySelectorAll('.statement')];
  const words = statements.map((s) => splitWords(s));
  const idx = hero.querySelector('.hud__idx');
  const label = hero.querySelector('.hud__label');
  const rail = hero.querySelector('.hero__rail span');
  let stage = 0;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 5.6)}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle(self) { sc?.setRunning(self.isActive || self.progress < 1); },
    },
  });

  // HUD et rail suivent la timeline lissée (pas la position brute du scroll)
  tl.eventCallback('onUpdate', () => {
    gsap.set(rail, { scaleY: tl.progress() });
    const s = Math.min(4, Math.round(state.progress));
    if (s !== stage) {
      stage = s;
      idx.textContent = String(s).padStart(2, '0');
      label.textContent = LABELS[s];
    }
  });

  // Chaque phrase apparaît quand sa forme est posée, pas pendant la transformation.
  const statement = (k, at, keep = false) => {
    const el = statements[k];
    gsap.set(words[k], { opacity: 0.07 });
    tl.set(el, { autoAlpha: 1, yPercent: 0 }, at);
    tl.fromTo(words[k], { opacity: 0.07, y: 18 }, { opacity: 1, y: 0, duration: 0.32, stagger: 1.1 / words[k].length, ease: 'power1.out' }, at);
    if (!keep) tl.to(el, { autoAlpha: 0, yPercent: -40, duration: 0.45, ease: 'power1.in' }, at + 1.75);
  };
  const morph = (to, vars, at) => tl.to(state, { progress: to, duration: 1.45, ease: 'power2.inOut', ...vars }, at);

  tl.to('.hero__intro', { yPercent: -14, autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, 0)
    .to('.hud__scroll', { autoAlpha: 0, duration: 0.4 }, 0)
    .to(glow, { opacity: 0.35, duration: 1.6 }, 0.2);
  morph(1, { rotY: 0.55, rotX: 0.32, camZ: 11.2 }, 0.3);
  statement(0, 1.35);
  morph(2, { rotY: 0.05, rotX: 0.16, camZ: 10.4 }, 3.2);
  statement(1, 4.2);
  morph(3, { rotY: -0.52, rotX: 0.2, camZ: 11.4 }, 6.1);
  tl.to(glow, { opacity: 0.9, duration: 1.4 }, 6.2);
  statement(2, 7.1);
  morph(4, { rotY: 0.0, rotX: 0.46, camZ: 9.4, y: 0.2 }, 9.0);
  tl.to(glow, { opacity: 0.45, duration: 1.2 }, 9.1);
  statement(3, 10.0, true);
  tl.to(state, { opacity: 0.3, camZ: 8.6, duration: 1.2, ease: 'power1.in' }, 12.0)
    .to(statements[3], { autoAlpha: 0, yPercent: -30, duration: 0.7, ease: 'power1.in' }, 12.2)
    .to({}, { duration: 0.2 }, 13.0);

  function playIntro() {
    const intro = gsap.timeline();
    if (sc) intro.fromTo(state, { intro: 0 }, { intro: 1, duration: 2.8, ease: 'power2.out' }, 0);
    intro
      .fromTo(glow, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .fromTo('.hero__title .line > span', { y: 0, yPercent: 108 }, { y: 0, yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'power4.out' }, 0.35)
      .fromTo(['.hero__intro .eyebrow', '.hero__sub', '.hero__ctas', '.hero__proof'], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out' }, 0.7)
      .fromTo(['.hero__hud', '.hero__rail'], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 1.2);
    return intro;
  }

  return { playIntro };
}
