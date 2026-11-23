import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { initSmooth } from './js/smooth.js';
import { initHero } from './js/hero/hero.js';
import { initTicker, initServices, initStats, initWork, initReveals, initSpotlight, initReviews, initAbout } from './js/sections.js';
import { initContact } from './js/contact.js';
import { runPreloader, initCursor, initMagnetic, initNav, initFooter, initConsent } from './js/ui.js';
import { wait } from './js/utils.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  const smooth = initSmooth(reduced);
  smooth.stop();

  const fonts = Promise.all([
    document.fonts.load('700 100px "Bricolage Grotesque Variable"'),
    document.fonts.load('italic 400 40px "Instrument Serif"'),
    document.fonts.load('400 12px "JetBrains Mono Variable"'),
  ]).catch(() => {});
  await Promise.race([fonts, wait(2500)]);

  // Les sections épinglées d'abord (ordre du document), puis tout le reste.
  const hero = initHero({ reduced });
  initWork(reduced);
  initTicker(reduced);
  initServices(reduced);
  initStats(reduced);
  initReveals(reduced);
  initSpotlight();
  initReviews(reduced);
  initAbout(reduced);
  initContact();
  initFooter(smooth, reduced);
  initNav(smooth);
  initCursor(reduced);
  initMagnetic(reduced);

  await runPreloader({ reduced, ready: Promise.resolve(), onReveal: () => hero.playIntro() });
  smooth.start();
  ScrollTrigger.refresh();
  if (location.hash && document.querySelector(location.hash)) {
    smooth.scrollTo(document.querySelector(location.hash), { immediate: true });
  }
  initConsent();
  document.documentElement.classList.add('is-ready');
  if (import.meta.env.DEV) window.__ri = { gsap, ScrollTrigger, smooth };
}

boot().catch((err) => {
  console.error(err);
  document.querySelector('.preloader')?.remove();
  document.documentElement.classList.add('no-anim');
});
