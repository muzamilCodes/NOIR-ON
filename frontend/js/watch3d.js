import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Canvas-texture helpers for printed dial graphics (power reserve, tourbillon
// ring, nameplate). These let the 3D model carry crisp printed elements.
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

// Power-reserve subdial face: silver tick ring, black disc, arc text, gold arc.
function powerReserveTexture() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 6;
    ctx.clearRect(0, 0, w, h);
    // outer silver ring
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 14; ctx.strokeStyle = '#d8d8dc'; ctx.stroke();
    // black inner disc
    ctx.beginPath(); ctx.arc(cx, cy, R - 12, 0, Math.PI * 2);
    ctx.fillStyle = '#141416'; ctx.fill();
    // white tick marks around top
    ctx.strokeStyle = '#f2f2f2';
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI * 0.75 + (i / 12) * Math.PI * 1.5;
      const r1 = R - 2, r2 = R - (i % 3 === 0 ? 16 : 9);
      ctx.lineWidth = i % 3 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    // gold arc segment (right)
    ctx.beginPath(); ctx.arc(cx, cy, R - 7, -Math.PI * 0.15, Math.PI * 0.35);
    ctx.lineWidth = 8; ctx.strokeStyle = '#e8c99a'; ctx.stroke();
    // arc text POWER RESERVE
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    const label = 'POWER RESERVE';
    const start = -Math.PI * 0.85;
    for (let i = 0; i < label.length; i++) {
      const a = start + (i / (label.length - 1)) * Math.PI * 0.7 + Math.PI * 0.5;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40));
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(label[i], 0, 0);
      ctx.restore();
    }
    // center hub
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0c0e'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3a40'; ctx.fill();
  });
}

// Tourbillon outer ring: silver ring with fine white ticks + SWISS text.
function tourbillonRingTexture() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 6;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 10; ctx.strokeStyle = '#c9c9cf'; ctx.stroke();
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
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(cx, cy + R - 22);
    ctx.fillText('SWISS', 0, 0);
    ctx.restore();
  });
}

// Nameplate: white rounded rect, black border, black bold brand text.
function nameplateTexture(text) {
  return makeCanvas(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = 22, pad = 8;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, r);
    ctx.fillStyle = '#f5f5f5'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 56px Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function octagonPath(r, ry, isShape) {
  const p = isShape ? new THREE.Shape() : new THREE.Path();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * r, y = Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

// Build the NOIRÉON skeleton-tourbillon watch. Returns a group whose animated
// parts are exposed via group.userData.parts.
export function createWatch(opts = {}) {
  const {
    caseColor = 0xc9a06a,   // rose gold
    steelColor = 0xc9c9cf,
    blackColor = 0x141416,
    strapColor = 0x0e0e10,
    brandText = 'NOIRÉON',
  } = opts;

  const group = new THREE.Group();
  const RY = 1.22; // vertical elongation (tonneau)

  const rose = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 0.95, roughness: 0.35 });
  const rosePolish = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: steelColor, metalness: 1, roughness: 0.25 });
  const black = new THREE.MeshStandardMaterial({ color: blackColor, metalness: 0.6, roughness: 0.5 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, metalness: 0.1, roughness: 0.4, emissive: 0xf2f2ee, emissiveIntensity: 0.25 });
  const ruby = new THREE.MeshStandardMaterial({ color: 0xd0208a, metalness: 0.4, roughness: 0.2, emissive: 0xd0208a, emissiveIntensity: 0.6 });
  const strapMat = new THREE.MeshStandardMaterial({ color: strapColor, metalness: 0.05, roughness: 0.95 });
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: 0xaaccff, metalness: 0, roughness: 0.03, transmission: 0.92,
    transparent: true, opacity: 0.30, ior: 1.77, thickness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02,
  });

  // ---- Case middle (octagonal tonneau) ----
  const caseMid = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.28, 0.5, 8, 1, false, Math.PI / 8), rose);
  caseMid.rotation.x = Math.PI / 2;
  caseMid.scale.y = RY;
  group.add(caseMid);

  // ---- Faceted armored side blocks (lugs) ----
  const blockGeo = new THREE.BoxGeometry(0.34, 0.62, 0.42);
  [[-1, 0.62], [-1, -0.62], [1, 0.62], [1, -0.62]].forEach(([sx, sy]) => {
    const b = new THREE.Mesh(blockGeo, rose);
    b.position.set(sx * 1.28, sy, -0.02);
    b.rotation.z = sx * sy * 0.22;
    b.rotation.y = sx * 0.25;
    group.add(b);
  });
  // top & bottom strap guards
  [1, -1].forEach((sy) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.4), rose);
    g.position.set(0, sy * 1.5, -0.05);
    group.add(g);
  });

  // ---- Bezel (octagonal polished ring frame) ----
  const bezelShape = octagonPath(1.34, 1.34 * RY, true);
  bezelShape.holes.push(octagonPath(1.02, 1.02 * RY, false));
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.34, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2,
  });
  bezelGeo.translate(0, 0, -0.17);
  const bezel = new THREE.Mesh(bezelGeo, rosePolish);
  bezel.position.z = 0.16;
  group.add(bezel);

  // ---- Main plate ring (black skeleton frame) ----
  const plateShape = octagonPath(1.0, 1.0 * RY, true);
  plateShape.holes.push(octagonPath(0.5, 0.6, false));
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: 0.06, bevelEnabled: false });
  const plate = new THREE.Mesh(plateGeo, black);
  plate.position.z = 0.0;
  group.add(plate);

  // ---- Sapphire crystal (edge-to-edge) ----
  const sapShape = octagonPath(1.02, 1.02 * RY, true);
  const sapGeo = new THREE.ExtrudeGeometry(sapShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  const sapphireMesh = new THREE.Mesh(sapGeo, sapphire);
  sapphireMesh.position.z = 0.36;
  group.add(sapphireMesh);

  // ---- Black skeleton bridges ----
  const bridgeDefs = [
    { w: 1.5, h: 0.22, x: -0.1, y: 0.15, rot: 0.5 },
    { w: 1.4, h: 0.2, x: 0.15, y: -0.1, rot: -0.4 },
    { w: 0.9, h: 0.18, x: -0.45, y: -0.35, rot: 0.9 },
    { w: 1.0, h: 0.16, x: 0.4, y: 0.42, rot: -0.7 },
  ];
  bridgeDefs.forEach((d) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.08), black);
    b.position.set(d.x, d.y, 0.1);
    b.rotation.z = d.rot;
    group.add(b);
  });

  // ---- Ruby jewels on bridges ----
  [[-0.62, 0.28], [-0.55, 0.16], [-0.48, 0.05], [0.05, -0.05], [0.0, -0.62], [0.3, 0.3]].forEach(([x, y]) => {
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), ruby);
    j.position.set(x, y, 0.15);
    group.add(j);
  });

  // ---- Gear train (steel) ----
  const parts = { gears: [] };
  const gearDefs = [
    { r: 0.34, x: 0.42, y: 0.05 }, { r: 0.26, x: 0.62, y: -0.25 },
    { r: 0.3, x: 0.2, y: -0.3 }, { r: 0.22, x: 0.5, y: 0.35 }, { r: 0.4, x: 0.72, y: 0.1 },
  ];
  gearDefs.forEach((g, i) => {
    const gear = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(g.r, g.r, 0.05, 28), steel);
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.02, 8, 40), steel);
    gear.add(rim);
    // teeth
    const teeth = 14;
    for (let t = 0; t < teeth; t++) {
      const a = (t / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), steel);
      tooth.position.set(Math.cos(a) * (g.r + 0.03), Math.sin(a) * (g.r + 0.03), 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 12), black);
    hub.rotation.x = Math.PI / 2;
    gear.add(hub);
    gear.position.set(g.x, g.y, 0.08 + i * 0.012);
    group.add(gear);
    parts.gears.push(gear);
  });

  // ---- Power-reserve subdial at 12 ----
  const pr = new THREE.Group();
  pr.position.set(0, 0.66, 0.14);
  const prFace = new THREE.Mesh(new THREE.CircleGeometry(0.44, 48), new THREE.MeshBasicMaterial({ map: powerReserveTexture(), transparent: true }));
  pr.add(prFace);
  const prHand = new THREE.Group();
  const prHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.02), lume);
  prHandMesh.position.y = 0.14;
  prHand.add(prHandMesh);
  prHand.position.z = 0.03;
  pr.add(prHand);
  group.add(pr);
  parts.prHand = prHand;

  // ---- Nameplate center ----
  const plate2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.215),
    new THREE.MeshBasicMaterial({ map: nameplateTexture(brandText), transparent: true })
  );
  plate2.position.set(0, 0.24, 0.2);
  group.add(plate2);

  // ---- Tourbillon at 6 ----
  const tb = new THREE.Group();
  tb.position.set(0, -0.66, 0.14);
  const tbRing = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshBasicMaterial({ map: tourbillonRingTexture(), transparent: true }));
  tb.add(tbRing);
  const cage = new THREE.Group();
  const cageRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 12, 48), steel);
  cage.add(cageRing);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.03), steel);
    spoke.rotation.z = (i / 3) * Math.PI;
    cage.add(spoke);
  }
  const balance = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 10, 32), steel);
  cage.add(balance);
  const tbJewel = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), ruby);
  cage.add(tbJewel);
  cage.position.z = 0.05;
  tb.add(cage);
  group.add(tb);
  parts.tourbillon = cage;

  // ---- Hands (angular luminous batons with rose-gold tips) ----
  const mkHand = (len, z) => {
    const pivot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, len, 0.03), lume);
    body.position.y = len / 2 - 0.08;
    pivot.add(body);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.032), rosePolish);
    tip.position.y = len - 0.1;
    pivot.add(tip);
    pivot.position.z = z;
    group.add(pivot);
    return pivot;
  };
  parts.hour = mkHand(0.62, 0.26);
  parts.minute = mkHand(0.92, 0.29);
  const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20), black);
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.z = 0.31;
  group.add(centerCap);

  // ---- Crown (black faceted, 3 o'clock) ----
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.26, 8), black);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.42, -0.1, 0);
  group.add(crown);

  // ---- Strap (black woven) ----
  [1, -1].forEach((dir) => {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 10, 40, Math.PI * 0.6), strapMat);
    strap.rotation.z = dir > 0 ? -Math.PI * 0.2 : Math.PI + Math.PI * 0.2;
    strap.position.set(0, dir * 1.5, -0.16);
    strap.scale.z = 0.5;
    group.add(strap);
  });

  group.userData.parts = parts;
  return group;
}

// Set hour/minute hands + power-reserve hand from a Date.
function setHands(parts, date) {
  if (!parts) return;
  const s = date.getSeconds() + date.getMilliseconds() / 1000;
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  if (parts.minute) parts.minute.rotation.z = -(m / 60) * Math.PI * 2;
  if (parts.hour) parts.hour.rotation.z = -(h / 12) * Math.PI * 2;
  if (parts.prHand) parts.prHand.rotation.z = -0.6 + Math.sin(date.getTime() / 4000) * 0.5;
}

// Animate the moving movement parts (tourbillon + gear train).
function spinMovement(parts, t) {
  if (!parts) return;
  if (parts.tourbillon) parts.tourbillon.rotation.z = t * 1.6;
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.4); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 3.0); rim.position.set(-6, 3, -5); scene.add(rim);
  const fill = new THREE.PointLight(0x4a90e2, 3, 24); fill.position.set(-4, -3, 4); scene.add(fill);
  const top = new THREE.PointLight(0xffffff, 1.4, 20); top.position.set(0, 6, 2); scene.add(top);
}

function makeRenderer(canvas, alpha = true) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function fitRenderer(renderer, camera, canvas) {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function makeParticles(count = 320, spread = 9) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xd4af37, size: 0.035, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
}

function makeOrbitRings() {
  const group = new THREE.Group();
  const mk = (radius, color, opacity, tx, ty) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.008, 8, 128),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = tx; ring.rotation.y = ty;
    group.add(ring);
    return ring;
  };
  mk(2.6, 0xd4af37, 0.5, Math.PI / 2.2, 0.2);
  mk(3.1, 0x4a90e2, 0.35, Math.PI / 1.8, -0.3);
  mk(3.6, 0xf0c75e, 0.22, Math.PI / 2.6, 0.5);
  return group;
}

// ---------------------------------------------------------------------------
// Hero / product viewer
// ---------------------------------------------------------------------------
export function initHeroWatch(canvas, opts = {}) {
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.6);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(1.3);
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
    watch.rotation.y = Math.sin(t * 0.35) * 0.5 + mx * 0.4;
    watch.rotation.x = Math.sin(t * 0.4) * 0.1 + my * 0.25;
    watch.position.y = Math.sin(t * 1.1) * 0.1;
    spinMovement(watch.userData.parts, t);
    setHands(watch.userData.parts, new Date());
    particles.rotation.y = t * 0.05;
    rings.rotation.y = t * 0.25;
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
// Small card watches (paused offscreen)
// ---------------------------------------------------------------------------
export function initCardWatch(canvas, opts = {}) {
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 5.0);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(0.92);
  scene.add(watch);
  fitRenderer(renderer, camera, canvas);

  const clock = new THREE.Clock();
  let visible = true, raf = null;
  const spin = opts.spinSpeed ?? 0.5;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    watch.rotation.y = Math.sin(t * spin) * 0.7 + t * 0.12;
    watch.rotation.x = Math.sin(t * 0.5) * 0.08;
    watch.position.y = Math.sin(t * 1.3) * 0.05;
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
  window.addEventListener('resize', () => fitRenderer(renderer, camera, canvas));
  return { scene, renderer };
}
