// Pages secondaires (mentions légales, 404) : même identité, sans la scène 3D.
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmooth } from './js/smooth.js';
import { initCursor, initMagnetic, initFooter, initConsent } from './js/ui.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = initSmooth(reduced);

initCursor(reduced);
initMagnetic(reduced);
initFooter(smooth, reduced);
initConsent();

const burger = document.querySelector('.nav__burger');
const menu = document.getElementById('menu');
burger?.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  if (open) smooth.stop(); else smooth.start();
});

if (!reduced) {
  gsap.fromTo('[data-in]', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
}
