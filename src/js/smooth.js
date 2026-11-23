import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Défilement doux (Lenis) synchronisé avec ScrollTrigger. Désactivé si l'utilisateur réduit les animations. */
export function initSmooth(reduced) {
  if (reduced) {
    return {
      lenis: null,
      scrollTo(target, opts = {}) {
        if (target === 0 || target === '#accueil') return window.scrollTo({ top: 0, behavior: opts.immediate ? 'auto' : 'smooth' });
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        el?.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
      },
      stop() {},
      start() {},
    };
  }
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return {
    lenis,
    scrollTo(target, opts = {}) {
      const t = target === '#accueil' ? 0 : target;
      lenis.scrollTo(t, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4), ...opts });
    },
    stop() { lenis.stop(); },
    start() { lenis.start(); },
  };
}
