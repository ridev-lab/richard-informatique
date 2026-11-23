// Formes du héros, échantillonnées en nuages de points.
// 0 Signal (écran + R)  1 Bruit (galaxie)  2 Réseau (globe)  3 Croissance (barres)  4 Système (grille)
// Chaque forme a exactement N points : le point i de la forme A devient le point i de la forme B.

const TAU = Math.PI * 2;

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

// Échantillonne l'intérieur d'un glyphe dessiné sur un canvas. Renvoie des coordonnées normalisées [-0.5, 0.5].
function glyphSampler(char, font, rng) {
  const S = 220;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.fillText(char, S / 2, S / 2 + S * 0.04);
  const data = ctx.getImageData(0, 0, S, S).data;
  const pts = [];
  let minX = S, maxX = 0, minY = S, maxY = 0;
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      if (data[(y * S + x) * 4 + 3] > 140) {
        pts.push(x, y);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (pts.length < 40) return null;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, h = maxY - minY || 1;
  return () => {
    const k = ((rng() * pts.length) / 2 | 0) * 2;
    return [(pts[k] + rng() - cx) / h, -(pts[k + 1] + rng() - cy) / h];
  };
}

function onRectPerimeter(rng, w, h) {
  const p = rng() * (2 * w + 2 * h);
  if (p < w) return [-w / 2 + p, h / 2];
  if (p < 2 * w) return [-w / 2 + (p - w), -h / 2];
  if (p < 2 * w + h) return [-w / 2, -h / 2 + (p - 2 * w)];
  return [w / 2, -h / 2 + (p - 2 * w - h)];
}

function onBoxSurface(rng, cx, cy, cz, w, h, d, edgeBias = 0.4) {
  if (rng() < edgeBias) {
    // sur une arête
    const axis = (rng() * 3) | 0;
    const sx = rng() < 0.5 ? -1 : 1, sy = rng() < 0.5 ? -1 : 1, sz = rng() < 0.5 ? -1 : 1;
    let x = cx + (sx * w) / 2, y = cy + (sy * h) / 2, z = cz + (sz * d) / 2;
    if (axis === 0) x = cx + (rng() - 0.5) * w;
    else if (axis === 1) y = cy + (rng() - 0.5) * h;
    else z = cz + (rng() - 0.5) * d;
    return [x, y, z];
  }
  const aXY = w * h, aXZ = w * d, aYZ = h * d, tot = 2 * (aXY + aXZ + aYZ);
  let r = rng() * tot;
  const u = rng() - 0.5, v = rng() - 0.5, s = rng() < 0.5 ? -0.5 : 0.5;
  if ((r -= 2 * aXY) < 0) return [cx + u * w, cy + v * h, cz + s * d];
  if ((r -= 2 * aXZ) < 0) return [cx + u * w, cy + s * h, cz + v * d];
  return [cx + s * w, cy + u * h, cz + v * d];
}

function latLonToVec(lat, lon, r) {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
}

function slerpArc(a, b, t, r, lift) {
  const dot = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (r * r);
  const om = Math.acos(Math.min(1, Math.max(-1, dot)));
  const so = Math.sin(om) || 1;
  const k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
  const h = 1 + Math.sin(t * Math.PI) * lift * om;
  return [(a[0] * k1 + b[0] * k2) * h, (a[1] * k1 + b[1] * k2) * h, (a[2] * k1 + b[2] * k2) * h];
}

export function buildShapes(N, fontFamily) {
  const rng = mulberry32(1987);
  const P = [0, 1, 2, 3, 4].map(() => new Float32Array(N * 3));
  const A = [0, 1, 2, 3, 4].map(() => new Float32Array(N));
  const rand = new Float32Array(N * 4);
  const set = (s, i, x, y, z, acc = 0) => { P[s][i * 3] = x; P[s][i * 3 + 1] = y; P[s][i * 3 + 2] = z; A[s][i] = acc; };

  const glyph = glyphSampler('R', `800 200px ${fontFamily}`, rng) || glyphSampler('R', '900 200px system-ui, sans-serif', rng);

  // ---------- 0. Signal : moniteur avec un R
  const W = 4.4, H = 2.75, D = 0.24, SY = 0.62;
  for (let i = 0; i < N; i += 1) {
    const r = i / N;
    if (r < 0.16) {
      const inner = rng() < 0.35;
      const [x, y] = onRectPerimeter(rng, inner ? W - 0.28 : W, inner ? H - 0.28 : H);
      set(0, i, x, y + SY, (rng() - 0.5) * 0.02);
    } else if (r < 0.22) {
      const [x, y] = onRectPerimeter(rng, W, H);
      set(0, i, x, y + SY, -D * rng());
    } else if (r < 0.36) {
      // lignes d'interface sur l'écran
      const rows = 12;
      const row = (rng() * rows) | 0;
      const y = -H / 2 + 0.3 + (row / (rows - 1)) * (H - 0.6);
      const x = -W / 2 + 0.3 + rng() * (W - 0.6);
      set(0, i, x, y + SY, 0.005);
    } else if (r < 0.66 && glyph) {
      const [gx, gy] = glyph();
      set(0, i, gx * 1.95, gy * 1.95 + SY, 0.05 + (rng() - 0.5) * 0.08, 1);
    } else if (r < 0.74) {
      set(0, i, (rng() - 0.5) * (W - 0.3), (rng() - 0.5) * (H - 0.3) + SY, 0.0);
    } else if (r < 0.82) {
      const [x, y, z] = onBoxSurface(rng, 0, -1.08 + SY - 0.62, -0.14, 0.42, 0.62, 0.18, 0.5);
      set(0, i, x, y, z);
    } else if (r < 0.93) {
      const a = rng() * TAU, rr = Math.sqrt(rng());
      set(0, i, Math.cos(a) * 1.35 * rr, -1.08 + SY - 0.95 + (rng() - 0.5) * 0.04, -0.14 + Math.sin(a) * 0.48 * rr);
    } else {
      const a = rng() * TAU, b = Math.acos(2 * rng() - 1), rr = 2.6 + rng() * 2.2;
      set(0, i, Math.sin(b) * Math.cos(a) * rr * 1.4, Math.cos(b) * rr * 0.8, Math.sin(b) * Math.sin(a) * rr * 0.6, rng() < 0.08 ? 1 : 0);
    }
  }

  // ---------- 1. Bruit : galaxie spirale + poussière
  const tilt = 1.05, ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < N; i += 1) {
    if (rng() < 0.74) {
      const rr = 0.3 + 4.4 * Math.pow(rng(), 0.9);
      const arm = (rng() * 3) | 0;
      const a = (arm * TAU) / 3 + rr * 0.62 + gauss(rng) * 0.28;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const y = gauss(rng) * 0.18 * (1 + rr * 0.1);
      set(1, i, x, y * ct - z * st, y * st + z * ct, rng() < 0.035 ? 1 : 0);
    } else {
      const a = rng() * TAU, b = Math.acos(2 * rng() - 1), rr = 1 + Math.pow(rng(), 0.6) * 5;
      set(1, i, Math.sin(b) * Math.cos(a) * rr * 1.4, Math.cos(b) * rr * 0.7, Math.sin(b) * Math.sin(a) * rr, rng() < 0.05 ? 1 : 0);
    }
  }

  // ---------- 2. Réseau : globe + liaisons depuis les Landes
  const R = 2.25;
  const home = latLonToVec(43.64, -1.38, R);
  const dests = [[48.85, 2.35], [40.71, -74.0], [51.5, -0.12], [35.68, 139.7], [-33.9, 151.2], [55.75, 37.6], [-23.5, -46.6], [1.35, 103.8], [64.1, -21.9], [30.0, 31.2]].map(([la, lo]) => latLonToVec(la, lo, R));
  const golden = Math.PI * (3 - Math.sqrt(5));
  let fib = 0;
  const fibN = Math.floor(N * 0.5);
  for (let i = 0; i < N; i += 1) {
    const r = rng();
    if (r < 0.5) {
      const k = fib++ % fibN;
      const y = 1 - (2 * (k + 0.5)) / fibN;
      const rad = Math.sqrt(1 - y * y), th = golden * k;
      const j = 1 + (rng() - 0.5) * 0.015;
      set(2, i, Math.cos(th) * rad * R * j, y * R * j, Math.sin(th) * rad * R * j);
    } else if (r < 0.72) {
      if (rng() < 0.55) {
        const lon = ((rng() * 12) | 0) * 30, lat = (rng() - 0.5) * 180;
        const v = latLonToVec(lat, lon, R * 1.002);
        set(2, i, v[0], v[1], v[2]);
      } else {
        const lat = -60 + ((rng() * 7) | 0) * 20, lon = rng() * 360;
        const v = latLonToVec(lat, lon, R * 1.002);
        set(2, i, v[0], v[1], v[2]);
      }
    } else if (r < 0.82) {
      const a = rng() * TAU, rr = 3.2 + gauss(rng) * 0.04;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, t2 = 0.42;
      set(2, i, x, -z * Math.sin(t2), z * Math.cos(t2), rng() < 0.05 ? 1 : 0);
    } else if (r < 0.88) {
      const v = [home[0] + gauss(rng) * 0.07, home[1] + gauss(rng) * 0.07, home[2] + gauss(rng) * 0.07];
      const l = Math.hypot(v[0], v[1], v[2]) / (R * 1.01);
      set(2, i, v[0] / l, v[1] / l, v[2] / l, 1);
    } else {
      const d = dests[(rng() * dests.length) | 0];
      const v = slerpArc(home, d, rng(), R, 0.22);
      set(2, i, v[0], v[1], v[2], 0.85);
    }
  }

  // ---------- 3. Croissance : barres + courbe
  const heights = [0.55, 0.8, 1.1, 1.45, 1.95, 2.55, 3.45];
  const base = -1.75, bw = 0.5, gap = 0.86;
  const x0 = -((heights.length - 1) * gap) / 2;
  const areas = heights.map((h) => 2 * (bw * h * 2 + bw * bw));
  const totA = areas.reduce((a, b) => a + b, 0);
  const tops = heights.map((h, k) => [x0 + k * gap, base + h + 0.42]);
  const curveAt = (t) => {
    const f = t * (tops.length - 1), k = Math.min(tops.length - 2, Math.floor(f)), u = f - k;
    const e = u * u * (3 - 2 * u);
    return [tops[k][0] + (tops[k + 1][0] - tops[k][0]) * u, tops[k][1] + (tops[k + 1][1] - tops[k][1]) * e];
  };
  for (let i = 0; i < N; i += 1) {
    const r = rng();
    if (r < 0.64) {
      let pick = rng() * totA, k = 0;
      while (k < heights.length - 1 && (pick -= areas[k]) > 0) k += 1;
      const h = heights[k];
      const [x, y, z] = onBoxSurface(rng, x0 + k * gap, base + h / 2, 0, bw, h, bw, 0.45);
      set(3, i, x, y, z, k === heights.length - 1 ? 1 : 0);
    } else if (r < 0.76) {
      const t = rng();
      const [x, y] = curveAt(t);
      set(3, i, x + gauss(rng) * 0.015, y + gauss(rng) * 0.015, 0.3 + gauss(rng) * 0.015, 1);
    } else if (r < 0.79) {
      // pointe de flèche
      const [ex, ey] = tops[tops.length - 1];
      const s = rng(), side = rng() < 0.5 ? 1 : -1;
      set(3, i, ex - s * 0.3, ey + side * s * 0.22 - s * 0.12 + 0.12 * (1 - s) * 0, 0.3, 1);
    } else if (r < 0.93) {
      const line = (rng() * 9) | 0;
      const z = -1.6 + line * 0.4;
      set(3, i, -3.8 + rng() * 7.6, base, z);
    } else {
      set(3, i, (rng() - 0.5) * 9, base + rng() * 4.5, (rng() - 0.5) * 4);
    }
  }

  // ---------- 4. Système : sol quadrillé + nœuds
  const gy = -1.15, step = 0.75;
  const nodes = [];
  for (let k = 0; k < 14; k += 1) {
    nodes.push([Math.round((rng() - 0.5) * 16) * step * 0.5, Math.round(-rng() * 14) * step * 0.5, 0.25 + rng() * 1.3, k < 4 ? 1 : 0]);
  }
  for (let i = 0; i < N; i += 1) {
    const r = rng();
    if (r < 0.8) {
      const along = rng() < 0.5;
      const lineIdx = Math.round((rng() - 0.5) * 30);
      const t = rng();
      if (along) set(4, i, lineIdx * step, gy, -14 + t * 18);
      else set(4, i, -12 + t * 24, gy, Math.min(4, lineIdx * step * 0.6 - 4));
    } else {
      const n = nodes[(rng() * nodes.length) | 0];
      const s = 0.36;
      const [x, y, z] = onBoxSurface(rng, n[0], gy + n[2], n[1], s, s, s, 0.7);
      set(4, i, x, y, z, n[3]);
    }
  }

  for (let i = 0; i < N; i += 1) {
    rand[i * 4] = rng();
    rand[i * 4 + 1] = rng();
    rand[i * 4 + 2] = rng();
    rand[i * 4 + 3] = rng();
  }

  const accA = new Float32Array(N * 4);
  for (let i = 0; i < N; i += 1) {
    accA[i * 4] = A[0][i]; accA[i * 4 + 1] = A[1][i]; accA[i * 4 + 2] = A[2][i]; accA[i * 4 + 3] = A[3][i];
  }
  return { positions: P, accA, accB: A[4], rand };
}
