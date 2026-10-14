import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface WatchOptions {
  caseColor?: number;
  strapColor?: number;
  dialColor?: number;
  accentColor?: number;
  brandText?: string;
  spinSpeed?: number;
}

interface WatchParts {
  gears: THREE.Group[];
  tourbillon?: THREE.Object3D;
  hour?: THREE.Object3D;
  minute?: THREE.Object3D;
  second?: THREE.Object3D;
  prHand?: THREE.Object3D;
}

interface WatchGroup extends THREE.Group {
  userData: { parts: WatchParts };
}

// ---- canvas texture helpers ----
function makeCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Sunburst / guilloché dial: dark radial base with fine engraved rays.
function sunburstDialTexture(base = 0x111116): THREE.CanvasTexture {
  const hex = '#' + new THREE.Color(base).getHexString();
  return makeCanvas(768, 768, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2;
    const g = ctx.createRadialGradient(cx, cy * 0.82, R * 0.05, cx, cy, R);
    g.addColorStop(0, '#26262e');
    g.addColorStop(0.55, hex);
    g.addColorStop(1, '#050507');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // engraved radial rays
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.stroke();
    }
    ctx.restore();
    // subtle inner vignette
    const v = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  });
}

function powerReserveTexture(): THREE.CanvasTexture {
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

function tourbillonRingTexture(): THREE.CanvasTexture {
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
    ctx.fillText('TOURBILLON', cx, cy + R - 20);
  });
}

function nameplateTexture(text: string): THREE.CanvasTexture {
  return makeCanvas(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#efeae0';
    ctx.font = '600 54px Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  });
}

// ---- geometry helpers ----
function octagonShape(r: number, ry: number): THREE.Shape {
  const p = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * r, y = Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}
function octagonPath(r: number, ry: number): THREE.Path {
  const p = new THREE.Path();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * r, y = Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

// Domed sapphire crystal via lathe, bulging toward +Z.
function domedCrystal(aperture: number, bulge: number, mat: THREE.Material): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const rad = aperture * t;
    const hh = bulge * Math.sqrt(Math.max(0, 1 - t * t));
    pts.push(new THREE.Vector2(rad, hh));
  }
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.rotateX(Math.PI / 2); // +Y height axis -> +Z
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 20;
  return mesh;
}

// Dauphine (tapered, faceted) hand with a lume inlay.
function dauphineHand(len: number, wBase: number, tail: number, z: number, metal: THREE.Material, lume: THREE.Material): THREE.Group {
  const pivot = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-wBase, 0);
  sh.lineTo(-wBase * 0.34, len * 0.72);
  sh.lineTo(0, len);
  sh.lineTo(wBase * 0.34, len * 0.72);
  sh.lineTo(wBase, 0);
  sh.lineTo(wBase * 0.5, -tail);
  sh.lineTo(-wBase * 0.5, -tail);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  const frame = new THREE.Mesh(geo, metal);
  pivot.add(frame);
  // lume strip down the middle
  const strip = new THREE.Mesh(new THREE.BoxGeometry(wBase * 0.42, len * 0.66, 0.03), lume);
  strip.position.set(0, len * 0.4, 0.03);
  pivot.add(strip);
  pivot.position.z = z;
  return pivot;
}

export function createWatch(opts: WatchOptions = {}): WatchGroup {
  const { caseColor = 0xc9a06a, strapColor = 0x141418, dialColor = 0x111116, accentColor = 0xd4af37, brandText = 'NOIRÉON' } = opts;

  const group = new THREE.Group() as WatchGroup;
  const RY = 1.14;

  const gold = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.22, envMapIntensity: 1.25 });
  const goldPolish = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.08, envMapIntensity: 1.5 });
  const goldBrushed = new THREE.MeshStandardMaterial({ color: caseColor, metalness: 1, roughness: 0.38, envMapIntensity: 1.0 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xcfd0d6, metalness: 1, roughness: 0.18, envMapIntensity: 1.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, metalness: 0.6, roughness: 0.5 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xdff3e6, metalness: 0.05, roughness: 0.35, emissive: 0x9fe6c0, emissiveIntensity: 0.55 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xc0207a, metalness: 0.1, roughness: 0.08, clearcoat: 1, transmission: 0.4, transparent: true, opacity: 0.9 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 1, roughness: 0.2, envMapIntensity: 1.2 });
  const strapMat = new THREE.MeshStandardMaterial({ color: strapColor, metalness: 0.05, roughness: 0.82 });
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.12,
    clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5, reflectivity: 0.6,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.0,
  });

  // --- case: outer ring + solid mid body for visible thickness ---
  const caseShape = octagonShape(1.04, 1.04 * RY);
  caseShape.holes.push(octagonPath(0.88, 0.88 * RY));
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
  caseGeo.translate(0, 0, -0.2);
  group.add(new THREE.Mesh(caseGeo, gold));

  const bezelShape = octagonShape(1.02, 1.02 * RY);
  bezelShape.holes.push(octagonPath(0.85, 0.85 * RY));
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 });
  const bezel = new THREE.Mesh(bezelGeo, goldPolish);
  bezel.position.z = 0.28;
  group.add(bezel);

  // rehaut (inner flange ring between bezel and dial)
  const rehaut = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.83, 0.08, 64, 1, true), dark);
  rehaut.rotation.x = Math.PI / 2;
  rehaut.position.z = 0.22;
  group.add(rehaut);

  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.1, 8, 1, false, Math.PI / 8), goldBrushed);
  back.rotation.x = Math.PI / 2;
  back.scale.y = RY;
  back.position.z = -0.26;
  group.add(back);

  // lugs (angled, tapered)
  [1, -1].forEach((sy) => {
    [-1, 1].forEach((sx) => {
      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.4), gold);
      lug.position.set(sx * 0.34, sy * 1.12, -0.02);
      lug.rotation.x = sy * 0.35;
      group.add(lug);
    });
  });

  // --- dial ---
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.86, 96), new THREE.MeshStandardMaterial({ map: sunburstDialTexture(dialColor), metalness: 0.35, roughness: 0.55 }));
  dial.position.z = 0.14;
  group.add(dial);

  // minute track ring
  const track = new THREE.Mesh(new THREE.RingGeometry(0.76, 0.82, 96), new THREE.MeshStandardMaterial({ color: 0x34343c, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }));
  track.position.z = 0.15;
  group.add(track);

  // applied baton indices with lume, double at 12
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    const buildBaton = (offX: number) => {
      const holder = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.06 : 0.04, big ? 0.17 : 0.11, 0.03), goldPolish);
      holder.add(bar);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.028 : 0.02, big ? 0.12 : 0.08, 0.034), lume);
      lm.position.z = 0.004;
      holder.add(lm);
      holder.position.set(Math.sin(a) * 0.66 + Math.cos(a) * offX, Math.cos(a) * 0.66 - Math.sin(a) * offX, 0.18);
      holder.rotation.z = -a;
      group.add(holder);
    };
    if (i === 0) { buildBaton(-0.05); buildBaton(0.05); }
    else buildBaton(0);
  }

  // --- skeleton movement (bridges + gears + jewels) ---
  const parts: WatchParts = { gears: [] };
  [
    { w: 1.0, h: 0.17, x: -0.12, y: 0.14, rot: 0.5 },
    { w: 0.92, h: 0.15, x: 0.12, y: -0.06, rot: -0.45 },
    { w: 0.62, h: 0.13, x: -0.3, y: -0.3, rot: 0.9 },
  ].forEach((d) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.06), dark);
    b.position.set(d.x, d.y, 0.18);
    b.rotation.z = d.rot;
    group.add(b);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.01), gold);
    edge.position.set(d.x, d.y, 0.205);
    edge.rotation.z = d.rot;
    group.add(edge);
  });
  [
    { r: 0.21, x: 0.29, y: 0.08 }, { r: 0.15, x: 0.44, y: -0.16 }, { r: 0.17, x: 0.15, y: -0.22 },
  ].forEach((g, i) => {
    const gear = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(g.r, g.r, 0.03, 28), steel);
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(g.r * 1.9, 0.03, 0.02), steel);
      spoke.rotation.z = (s / 5) * Math.PI;
      gear.add(spoke);
    }
    gear.add(new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.02, 8, 40), steel));
    for (let t = 0; t < 20; t++) {
      const a = (t / 20) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.03), steel);
      tooth.position.set(Math.cos(a) * (g.r + 0.02), Math.sin(a) * (g.r + 0.02), 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    gear.position.set(g.x, g.y, 0.2 + i * 0.012);
    group.add(gear);
    parts.gears.push(gear);
  });
  [[-0.34, 0.18], [-0.28, 0.05], [0.0, -0.05], [0.02, -0.52]].forEach(([x, y]) => {
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 14), ruby);
    j.position.set(x, y, 0.22);
    group.add(j);
  });

  // --- power reserve subdial at 12 ---
  const pr = new THREE.Group();
  pr.position.set(0, 0.42, 0.22);
  pr.add(new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshBasicMaterial({ map: powerReserveTexture(), transparent: true })));
  const prHand = new THREE.Group();
  const prHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.014), steel);
  prHandMesh.position.y = 0.1;
  prHand.add(prHandMesh);
  prHand.position.z = 0.02;
  pr.add(prHand);
  group.add(pr);
  parts.prHand = prHand;

  // --- brand plate ---
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: nameplateTexture(brandText), transparent: true }));
  plate.position.set(0, 0.14, 0.24);
  group.add(plate);

  // --- tourbillon aperture at 6 ---
  const tb = new THREE.Group();
  tb.position.set(0, -0.44, 0.22);
  tb.add(new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshBasicMaterial({ map: tourbillonRingTexture(), transparent: true })));
  const cage = new THREE.Group();
  cage.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 44), goldPolish));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.02), goldPolish);
    spoke.rotation.z = (i / 3) * Math.PI;
    cage.add(spoke);
  }
  cage.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 28), steel));
  const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), dark);
  bal.rotation.x = Math.PI / 2;
  cage.add(bal);
  cage.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 14), ruby));
  cage.position.z = 0.05;
  tb.add(cage);
  group.add(tb);
  parts.tourbillon = cage;

  // --- hands ---
  parts.minute = dauphineHand(0.66, 0.055, 0.1, 0.28, goldPolish, lume);
  parts.hour = dauphineHand(0.46, 0.07, 0.1, 0.25, goldPolish, lume);
  const sec = new THREE.Group();
  const secBody = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.72, 0.012), accent);
  secBody.position.y = 0.26;
  sec.add(secBody);
  const secTail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.014), accent);
  secTail.position.y = -0.1;
  sec.add(secTail);
  sec.position.z = 0.31;
  group.add(sec);
  parts.second = sec;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 20), goldPolish);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.34;
  group.add(cap);

  // --- domed sapphire crystal ---
  const crystal = domedCrystal(0.86, 0.12, sapphire);
  crystal.position.z = 0.28;
  group.add(crystal);

  // --- fluted crown at 3 o'clock ---
  const crown = new THREE.Group();
  const cbody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 20), gold);
  cbody.rotation.z = Math.PI / 2;
  crown.add(cbody);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const flute = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.02), gold);
    flute.position.set(0, Math.cos(a) * 0.155, Math.sin(a) * 0.155);
    flute.rotation.x = -a;
    crown.add(flute);
  }
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), goldPolish);
  cab.position.x = 0.11;
  crown.add(cab);
  crown.position.set(1.14, -0.06, 0);
  group.add(crown);

  // --- articulated bracelet, curling back like on a wrist ---
  function addBracelet(side: 1 | -1) {
    const N = 9;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const w = 0.74 - u * 0.24;
      const len = 0.22;
      const thick = 0.13;
      const link = new THREE.Group();
      const metal = i % 2 === 0 ? goldBrushed : goldPolish;
      const outer = new THREE.Mesh(new THREE.BoxGeometry(w, thick, len), metal);
      link.add(outer);
      const center = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, thick + 0.01, len * 0.8), goldPolish);
      link.add(center);
      const y = side * (1.2 + u * 1.55);
      const z = -0.28 - u * u * 1.35;
      const rotX = side * (0.18 + u * 1.05);
      link.position.set(0, y, z);
      link.rotation.x = -rotX;
      group.add(link);
    }
    // buckle at the end of one side
    if (side === -1) {
      const buck = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 24), goldPolish);
      frame.scale.set(1.25, 0.9, 1);
      buck.add(frame);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 10), goldPolish);
      pin.rotation.z = Math.PI / 2;
      buck.add(pin);
      const u = 1;
      buck.position.set(0, side * (1.2 + u * 1.55 + 0.18), -0.28 - u * u * 1.35 - 0.12);
      buck.rotation.x = -side * (0.18 + 1.05) - Math.PI / 2;
      group.add(buck);
    }
  }
  addBracelet(1);
  addBracelet(-1);

  group.userData = { parts };
  return group;
}

function setHands(parts: WatchParts, date: Date): void {
  const s = date.getSeconds() + date.getMilliseconds() / 1000;
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  if (parts.minute) parts.minute.rotation.z = -(m / 60) * Math.PI * 2;
  if (parts.hour) parts.hour.rotation.z = -(h / 12) * Math.PI * 2;
  if (parts.second) parts.second.rotation.z = -(s / 60) * Math.PI * 2;
  if (parts.prHand) parts.prHand.rotation.z = -0.5 + Math.sin(date.getTime() / 4000) * 0.4;
}
function spinMovement(parts: WatchParts, t: number): void {
  if (parts.tourbillon) parts.tourbillon.rotation.z = t * 1.4;
  parts.gears.forEach((g, i) => { g.rotation.z = t * (i % 2 ? -1 : 1) * (0.8 + i * 0.35); });
}

function addEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
}
function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a22, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 1.4); rim.position.set(-6, 4, -5); scene.add(rim);
  const fill = new THREE.PointLight(0x88aaff, 1.1, 24); fill.position.set(-4, -3, 6); scene.add(fill);
  const front = new THREE.PointLight(0xffffff, 0.9, 20); front.position.set(0, 0, 6); scene.add(front);
}
function makeRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}
function fitRenderer(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): void {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
function makeParticles(count = 220, spread = 8): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xd4af37, size: 0.025, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
}
function makeOrbitRings(): THREE.Group {
  const group = new THREE.Group();
  const mk = (radius: number, color: number, opacity: number, tx: number, ty: number) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.005, 8, 128),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = tx; ring.rotation.y = ty;
    group.add(ring);
  };
  mk(2.1, 0xd4af37, 0.22, Math.PI / 2.1, 0.15);
  mk(2.5, 0x4a90e2, 0.16, Math.PI / 1.9, -0.2);
  return group;
}

export function initHeroWatch(canvas: HTMLCanvasElement | null, opts: WatchOptions = {}): () => void {
  if (!canvas) return () => {};
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 8.4);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(1.55);
  watch.rotation.y = -0.12;
  watch.rotation.x = -0.1;
  scene.add(watch);
  const particles = makeParticles(); scene.add(particles);
  const rings = makeOrbitRings(); scene.add(rings);
  fitRenderer(renderer, camera, canvas);

  let mx = -0.1, my = 0, running = true, raf = 0;
  const onMove = (e: MouseEvent) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMove);

  const clock = new THREE.Clock();
  function animate() {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    watch.rotation.y = -0.1 + Math.sin(t * 0.25) * 0.16 + mx * 0.16;
    watch.rotation.x = -0.08 + Math.sin(t * 0.4) * 0.03 - my * 0.08;
    watch.position.y = Math.sin(t * 1.0) * 0.05;
    spinMovement(watch.userData.parts, t);
    setHands(watch.userData.parts, new Date());
    particles.rotation.y = t * 0.04;
    rings.rotation.y = t * 0.18;
    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => fitRenderer(renderer, camera, canvas);
  window.addEventListener('resize', onResize);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

export function initCardWatch(canvas: HTMLCanvasElement | null, opts: WatchOptions = {}): () => void {
  if (!canvas) return () => {};
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);
  const renderer = makeRenderer(canvas);
  addEnvironment(scene, renderer);
  addLights(scene);

  const watch = createWatch(opts);
  watch.scale.setScalar(1.3);
  watch.rotation.y = -0.25;
  watch.rotation.x = -0.1;
  scene.add(watch);
  fitRenderer(renderer, camera, canvas);

  const clock = new THREE.Clock();
  const spin = opts.spinSpeed ?? 0.4;
  let raf = 0;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    watch.rotation.y = -0.22 + Math.sin(t * spin) * 0.32;
    watch.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.03;
    watch.position.y = Math.sin(t * 1.2) * 0.04;
    spinMovement(watch.userData.parts, t);
    setHands(watch.userData.parts, new Date());
    renderer.render(scene, camera);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (raf === 0) { clock.getDelta(); animate(); }
      } else if (raf !== 0) {
        cancelAnimationFrame(raf); raf = 0;
      }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);
  animate();

  const ro = new ResizeObserver(() => fitRenderer(renderer, camera, canvas));
  ro.observe(canvas);

  return () => {
    if (raf !== 0) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    renderer.dispose();
  };
}
