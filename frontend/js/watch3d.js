import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Canvas-texture helpers for printed dial graphics.
// ---------------------------------------------------------------------------
function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function powerReserveTexture() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 6;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 12; ctx.strokeStyle = '#cfcfd4'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R - 10, 0, Math.PI * 2);
    ctx.fillStyle = '#101013'; ctx.fill();
    ctx.strokeStyle = '#f2f2f2';
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.7 + (i / 10) * Math.PI * 1.4;
      const r1 = R - 2, r2 = R - (i % 5 === 0 ? 16 : 10);
      ctx.lineWidth = i % 5 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, R - 6, -Math.PI * 0.1, Math.PI * 0.4);
    ctx.lineWidth = 7; ctx.strokeStyle = '#e8c99a'; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    const label = 'POWER RESERVE';
    const start = -Math.PI * 0.8;
    for (let i = 0; i < label.length; i++) {
      const a = start + (i / (label.length - 1)) * Math.PI * 0.6 + Math.PI * 0.5;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * (R - 36), cy + Math.sin(a) * (R - 36));
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(label[i], 0, 0);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0c'; ctx.fill();
  });
}

function tourbillonRingTexture() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 6;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 9; ctx.strokeStyle = '#c9c9cf'; ctx.stroke();
    ctx.strokeStyle = '#f2f2f2';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = R - 1, r2 = R - (i % 5 === 0 ? 14 : 8);
      ctx.lineWidth = i % 5 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.fillStyle = '#e8e8ec';
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SWISS', cx, cy + R - 20);
  });
}

function nameplateTexture(text) {
  return makeCanvas(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e8e8ec';
    ctx.font = 'bold 60px Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function octagonShape(r, ry) {
  const p = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * r, y = Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}
function octagonPath(r, ry) {
  const p = new THREE.Path();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * r, y = Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

// ---------------------------------------------------------------------------
// Build a realistic NOIRÉON skeleton-tourbillon watch (dial faces +z).
// ---------------------------------------------------------------------------
export function createWatch(opts = {}) {
  const {
    caseColor = 0xc9a06a,
    strapColor = 0x0e0e10,
    brandText = 'NOIRÉON',
  } = opts;

  const group = new THREE.Group();
  const RY = 1.16;

  const rose = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.28 });
  const rosePolish = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.12 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9c9cf, metalness: 1, roughness: 0.22 });
  const black = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.5, roughness: 0.55 });
  const dialMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, metalness: 0.4, roughness: 0.6 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, metalness: 0.1, roughness: 0.4, emissive: 0xf2f2ee, emissiveIntensity: 0.3 });
  const ruby = new THREE.MeshStandardMaterial({ color: 0xd0208a, metalness: 0.3, roughness: 0.2, emissive: 0xd0208a, emissiveIntensity: 0.7 });
  const strapMat = new THREE.MeshStandardMaterial({ color: strapColor, metalness: 0.05, roughness: 0.95 });
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1,
    transparent: true, opacity: 0.10, ior: 1.77, thickness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02,
  });

  // ---- Case body: octagonal ring (open center so dial shows) ----
  const caseShape = octagonShape(1.02, 1.02 * RY);
  caseShape.holes.push(octagonPath(0.86, 0.86 * RY));
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  caseGeo.translate(0, 0, -0.16);
  const caseBody = new THREE.Mesh(caseGeo, rose);
  group.add(caseBody);

  // ---- Polished bezel ring on top ----
  const bezelShape = octagonShape(1.0, 1.0 * RY);
  bezelShape.holes.push(octagonPath(0.84, 0.84 * RY));
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  const bezel = new THREE.Mesh(bezelGeo, rosePolish);
  bezel.position.z = 0.26;
  group.add(bezel);

  // ---- Case back ----
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 8, 1, false, Math.PI / 8), rose);
  back.rotation.x = Math.PI / 2;
  back.scale.y = RY;
  back.position.z = -0.2;
  group.add(back);

  // ---- Lugs (integrated, top & bottom) ----
  [1, -1].forEach((sy) => {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.34, 0.34), rose);
    lug.position.set(0, sy * 1.08, -0.04);
    group.add(lug);
  });

  // ---- Dial plate (dark) ----
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.86, 64), dialMat);
  dial.position.z = 0.02;
  group.add(dial);

  // ---- Minute track ring ----
  const track = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.83, 64), new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }));
  track.position.z = 0.03;
  group.add(track);

  // ---- Hour markers (rose-gold batons) ----
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.05 : 0.035, big ? 0.14 : 0.09, 0.02), rosePolish);
    m.position.set(Math.sin(a) * 0.72, Math.cos(a) * 0.72, 0.06);
    m.rotation.z = -a;
    group.add(m);
  }

  // ---- Skeleton bridges (black) + gears + jewels ----
  const parts = { gears: [] };
  [
    { w: 1.0, h: 0.16, x: -0.12, y: 0.12, rot: 0.5 },
    { w: 0.9, h: 0.14, x: 0.12, y: -0.08, rot: -0.45 },
    { w: 0.6, h: 0.12, x: -0.3, y: -0.28, rot: 0.9 },
  ].forEach((d) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.05), black);
    b.position.set(d.x, d.y, 0.07);
    b.rotation.z = d.rot;
    group.add(b);
  });
  [
    { r: 0.2, x: 0.28, y: 0.06 }, { r: 0.15, x: 0.42, y: -0.16 }, { r: 0.17, x: 0.14, y: -0.2 },
  ].forEach((g, i) => {
    const gear = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(g.r, g.r, 0.03, 24), steel);
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.018, 8, 36), steel);
    gear.add(rim);
    for (let t = 0; t < 12; t++) {
      const a = (t / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.03), steel);
      tooth.position.set(Math.cos(a) * (g.r + 0.02), Math.sin(a) * (g.r + 0.02), 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    gear.position.set(g.x, g.y, 0.09 + i * 0.01);
    group.add(gear);
    parts.gears.push(gear);
  });
  [[-0.34, 0.16], [-0.28, 0.04], [0.0, -0.04], [0.0, -0.5]].forEach(([x, y]) => {
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), ruby);
    j.position.set(x, y, 0.11);
    group.add(j);
  });

  // ---- Power-reserve subdial at 12 ----
  const pr = new THREE.Group();
  pr.position.set(0, 0.42, 0.12);
  pr.add(new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshBasicMaterial({ map: powerReserveTexture(), transparent: true })));
  const prHand = new THREE.Group();
  const prHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.015), lume);
  prHandMesh.position.y = 0.1;
  prHand.add(prHandMesh);
  prHand.position.z = 0.02;
  pr.add(prHand);
  group.add(pr);
  parts.prHand = prHand;

  // ---- Nameplate center ----
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: nameplateTexture(brandText), transparent: true }));
  plate.position.set(0, 0.1, 0.13);
  group.add(plate);

  // ---- Tourbillon at 6 ----
  const tb = new THREE.Group();
  tb.position.set(0, -0.44, 0.12);
  tb.add(new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshBasicMaterial({ map: tourbillonRingTexture(), transparent: true })));
  const cage = new THREE.Group();
  cage.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 40), steel));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.02), steel);
    spoke.rotation.z = (i / 3) * Math.PI;
    cage.add(spoke);
  }
  cage.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 28), steel));
  cage.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), ruby));
  cage.position.z = 0.04;
  tb.add(cage);
  group.add(tb);
  parts.tourbillon = cage;

  // ---- Hands (luminous batons with rose tips) ----
  const mkHand = (len, w, z) => {
    const pivot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), lume);
    body.position.y = len / 2 - 0.06;
    pivot.add(body);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.022), rosePolish);
    tip.position.y = len - 0.08;
    pivot.add(tip);
    pivot.position.z = z;
    group.add(pivot);
    return pivot;
  };
  parts.hour = mkHand(0.42, 0.06, 0.18);
  parts.minute = mkHand(0.62, 0.045, 0.2);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), rosePolish);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.22;
  group.add(cap);

  // ---- Crystal (subtle transparent) ----
  const crystal = new THREE.Mesh(new THREE.CircleGeometry(0.85, 64), sapphire);
  crystal.position.z = 0.3;
  group.add(crystal);

  // ---- Crown at 3 ----
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 8), black);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.12, -0.05, 0);
  group.add(crown);

  // ---- Strap ----
  [1, -1].forEach((dir) => {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.26, 10, 32, Math.PI * 0.55), strapMat);
    strap.rotation.z = dir > 0 ? -Math.PI * 0.275 : Math.PI + Math.PI * 0.275;
    strap.position.set(0, dir * 1.15, -0.12);
    strap.scale.z = 0.5;
    group.add(strap);
  });

  group.userData.parts = parts;
  return group;
}

function setHands(parts, date) {
  if (!parts) return;
  const s = date.getSeconds() + date.getMilliseconds() / 1000;
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  if (parts.minute) parts.minute.rotation.z = -(m / 60) * Math.PI * 2;
  if (parts.hour) parts.hour.rotation.z = -(h / 12) * Math.PI * 2;
  if (parts.prHand) parts.prHand.rotation.z = -0.5 + Math.sin(date.getTime() / 4000) * 0.4;
}
function spinMovement(parts, t) {
  if (!parts) return;
  if (parts.tourbillon) parts.tourbillon.rotation.z = t * 1.4;
  if (parts.gears) parts.gears.forEach((g, i) => { g.rotation.z = t * (i % 2 ? -1 : 1) * (0.8 + i * 0.35); });
}

// ---------------------------------------------------------------------------
// Scene helpers
// ---------------------------------------------------------------------------
function addEnvironment(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
}
function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 2.2); rim.position.set(-6, 3, -4); scene.add(rim);
  const fill = new THREE.PointLight(0x88aaff, 2, 24); fill.position.set(-4, -3, 6); scene.add(fill);
  const front = new THREE.PointLight(0xffffff, 1.2, 20); front.position.set(0, 0, 6); scene.add(front);
}
function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}
function fitRenderer(renderer, camera, canvas) {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
function makeParticles(count = 260, spread = 8) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xd4af37, size: 0.03, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
}
function makeOrbitRings() {
  const group = new THREE.Group();
  const mk = (radius, color, opacity, tx, ty) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 8, 128),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = tx; ring.rotation.y = ty;
    group.add(ring);
    return ring;
  };
  mk(1.9, 0xd4af37, 0.4, Math.PI / 2.1, 0.15);
  mk(2.3, 0x4a90e2, 0.28, Math.PI / 1.9, -0.2);
  return group;
}

// ---------------------------------------------------------------------------
// Hero / product viewer (front-facing, gentle motion)
// ---------------------------------------------------------------------------
export function initHeroWatch(canvas, opts = {}) {
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(1.7);
  scene.add(watch);
  const particles = makeParticles(); scene.add(particles);
  const rings = makeOrbitRings(); scene.add(rings);
  fitRenderer(renderer, camera, canvas);

  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  let running = true;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    watch.rotation.y = Math.sin(t * 0.3) * 0.18 + mx * 0.28;   // mostly front
    watch.rotation.x = -0.08 + Math.sin(t * 0.4) * 0.05 + my * 0.16;
    watch.position.y = Math.sin(t * 1.0) * 0.05;
    spinMovement(watch.userData.parts, t);
    setHands(watch.userData.parts, new Date());
    particles.rotation.y = t * 0.04;
    rings.rotation.y = t * 0.2;
    renderer.render(scene, camera);
  }
  animate();
  window.addEventListener('resize', () => fitRenderer(renderer, camera, canvas));
  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was) { clock.getDelta(); animate(); }
  });
  return { scene, renderer };
}

// ---------------------------------------------------------------------------
// Small card watches
// ---------------------------------------------------------------------------
export function initCardWatch(canvas, opts = {}) {
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 5.6);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(1.5);
  scene.add(watch);
  fitRenderer(renderer, camera, canvas);

  const clock = new THREE.Clock();
  let visible = true, raf = null;
  const spin = opts.spinSpeed ?? 0.4;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    watch.rotation.y = Math.sin(t * spin) * 0.5;
    watch.rotation.x = -0.05 + Math.sin(t * 0.5) * 0.05;
    watch.position.y = Math.sin(t * 1.2) * 0.04;
    spinMovement(watch.userData.parts, t);
    setHands(watch.userData.parts, new Date());
    renderer.render(scene, camera);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const now = entry.isIntersecting;
      if (now && !visible) { visible = true; clock.getDelta(); if (raf == null) animate(); }
      else if (!now && visible) { visible = false; if (raf != null) { cancelAnimationFrame(raf); raf = null; } }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);
  animate();
  const ro = new ResizeObserver(() => fitRenderer(renderer, camera, canvas));
  ro.observe(canvas);
  return { scene, renderer };
}
