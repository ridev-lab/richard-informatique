export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Entoure chaque mot d'un <span class="w"> en conservant les balises internes (<em>…). */
export function splitWords(el) {
  if (el.dataset.splitDone) return [...el.querySelectorAll('.w')];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(document.createTextNode(part));
          else {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.append(s);
          }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  el.dataset.splitDone = '1';
  return [...el.querySelectorAll('.w')];
}
