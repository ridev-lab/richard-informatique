import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Group, Vector3, AdditiveBlending,
} from 'three';
import { buildShapes } from './shapes.js';
import { vertexShader, fragmentShader } from './shaders.js';

/**
 * Scène de particules du héros. L'état (`state`) est piloté de l'extérieur par la timeline GSAP du scroll.
 */
export function createHeroScene(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  const N = isSmall ? 7500 : 16000;
  const { positions, accA, accB, rand } = buildShapes(N, '"Bricolage Grotesque Variable"');
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions[0], 3));
  positions.forEach((arr, k) => geo.setAttribute(`aP${k}`, new BufferAttribute(arr, 3)));
  geo.setAttribute('aAccA', new BufferAttribute(accA, 4));
  geo.setAttribute('aAccB', new BufferAttribute(accB, 1));
  geo.setAttribute('aRand', new BufferAttribute(rand, 4));

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uSize: { value: isSmall ? 3.4 : 2.9 },
    uPixelRatio: { value: dpr },
    uViewH: { value: window.innerHeight },
    uMouse: { value: new Vector3(99, 99, 0) },
    uMouseStrength: { value: 0 },
    uIntro: { value: 0 },
    uOpacity: { value: 1 },
    uColA: { value: new Vector3(0.93, 0.91, 0.87) },
    uColB: { value: new Vector3(1.0, 0.36, 0.14) },
  };

  const material = new ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  const group = new Group();
  group.add(points);
  scene.add(group);

  // état piloté par le scroll
  const state = { progress: 0, rotY: -0.38, rotX: 0.06, x: 0, y: 0, camZ: 11, opacity: 1, intro: 0 };
  // layout : décalage du moniteur à côté du titre sur grand écran
  const layout = { baseX: 0, baseY: 0, scale: 1 };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: 0, target: 0 };
  const mouseWorld = new Vector3(99, 99, 0);
  const tmp = new Vector3();

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = -((e.clientY - r.top) / r.height) * 2 + 1;
    pointer.target = e.pointerType === 'mouse' ? 1 : 0.6;
  }
  function onLeave() { pointer.target = 0; }
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uViewH.value = h;
    const aspect = w / h;
    layout.scale = Math.min(1, Math.max(0.56, aspect / 1.25));
    layout.baseX = aspect > 1.15 ? Math.min(3.4, (aspect - 1) * 3.7) : 0;
    layout.baseY = aspect < 0.9 ? 1.5 : 0;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let running = true;
  let time = 0;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!running) return;
    time += reduced ? dt * 0.3 : dt;

    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    pointer.active += (pointer.target - pointer.active) * 0.05;

    // position de la souris projetée sur le plan z = 0
    tmp.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const dist = -camera.position.z / tmp.z;
    mouseWorld.copy(camera.position).addScaledVector(tmp, dist);

    // le décalage latéral ne vaut que pour la 1re forme
    const settle = Math.max(0, 1 - state.progress);
    group.position.x = layout.baseX * settle + state.x;
    group.position.y = layout.baseY * (0.4 + 0.6 * settle) + state.y;
    group.scale.setScalar(layout.scale);
    group.rotation.y = state.rotY + pointer.x * 0.22 + Math.sin(time * 0.25) * 0.04;
    group.rotation.x = state.rotX - pointer.y * 0.12;
    camera.position.z = state.camZ;

    uniforms.uTime.value = time;
    uniforms.uProgress.value = state.progress;
    uniforms.uOpacity.value = state.opacity;
    uniforms.uIntro.value = state.intro;
    uniforms.uMouse.value.copy(mouseWorld);
    uniforms.uMouseStrength.value = pointer.active;

    renderer.render(scene, camera);
  }

  return {
    state,
    frame,
    setRunning(v) {
      if (v && !running) last = performance.now();
      running = v;
    },
    renderOnce() { const was = running; running = true; frame(performance.now()); running = was; },
    destroy() {
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      geo.dispose(); material.dispose(); renderer.dispose();
    },
  };
}
