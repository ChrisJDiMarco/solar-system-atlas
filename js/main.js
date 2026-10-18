import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const App = window.App, D = App.D, E = App.E, S = App.state, GL = App.GL;
const AU_KM = E.AU_KM, LIN = 100, D2R = Math.PI / 180;
App.THREE = THREE;

// ---------- renderer (threejs-skills/fundamentals) ----------
const canvas = document.getElementById('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }); }
catch (e) { const l = document.getElementById('loading'); if (l) l.textContent = '3D graphics are unavailable here. Try reopening the Atlas.'; throw e; }
let glLost = false;
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glLost = true; });
canvas.addEventListener('webglcontextrestored', () => { glLost = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { S.time.jd = App.sim.jd; cabinet.remember('atlas', S); } catch (e) {} } });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.setClearColor(0x05070c);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 1e-7, 1e10);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false; controls.zoomSpeed = 1.1; controls.rotateSpeed = 0.6; controls.maxDistance = 2e8;

// ---------- mapping: heliocentric ecliptic AU (float64) -> scene; floating origin applied per object ----------
const logF = (r) => 60 * Math.log10(1 + r / 0.05);
const _m = new THREE.Vector3();
function mapAU(p, out) { out = out || _m; const r = Math.hypot(p[0], p[1], p[2]); const s = S.scale.dist === 'log' ? (r > 1e-14 ? logF(r) / r : 0) : LIN; return out.set(p[0] * s, p[2] * s, -p[1] * s); }
const trueMode = () => S.scale.size === 'true' && S.scale.dist === 'linear';
function visR(b) {
  if (trueMode()) return b.R / AU_KM * LIN;
  if (b.kind === 'star') return 2.2;
  if (b.kind === 'moon') return 0.035 + Math.pow(b.R / 1737, 0.6) * 0.12;
  if (b.kind === 'craft' || b.kind === 'hyp' || b.kind === 'probe' || b.kind === 'lagrange') return 0.5;
  if (b.kind === 'comet') return 0.03;
  return 0.18 + Math.pow(b.R / 6371, 0.55) * 0.35;
}
function moonScale(m, loc, out) {
  if (trueMode()) return out.copy(loc).multiplyScalar(LIN / AU_KM);
  const p = bodies[m.parent], a = loc.length() || 1;
  return out.copy(loc).multiplyScalar(visR(p) * (2 + 3 * Math.log10(Math.max(a / p.R, 1.05))) / a);
}

// ---------- bodies ----------
const bodies = {}; App.bodies = bodies; const list = [];
const sphereGeo = [new THREE.SphereGeometry(1, 16, 12), new THREE.SphereGeometry(1, 40, 28), new THREE.SphereGeometry(1, 72, 48)];
const poleQ = (pole) => { if (!pole) return new THREE.Quaternion(); const u = E.radec(pole[0], pole[1]); return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(u[0], u[2], -u[1]).normalize()); };
const hash = (s, k) => { let h = 2166136261 ^ k; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
function planetMat(type, c, atm, seed) {
  return new THREE.ShaderMaterial({ vertexShader: GL.vert, fragmentShader: GL.planetFrag, uniforms: {
    uSun: { value: new THREE.Vector3() }, c1: { value: new THREE.Color(c[0]) }, c2: { value: new THREE.Color(c[1]) }, c3: { value: new THREE.Color(c[2]) },
    uAtm: { value: new THREE.Vector3(...(atm || [0, 0, 0])) }, uAtmK: { value: atm ? 0.9 : 0 }, uType: { value: type }, uKind: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed },
    uOcc: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uSunR: { value: 1 }, uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingC: { value: new THREE.Vector4() } } });
}
function add(b) {
  b.obliq = b.tilt; b.h = [0, 0, 0]; b.sp = new THREE.Vector3(); b.loc = new THREE.Vector3();
  b.grp = new THREE.Group(); scene.add(b.grp);
  b.tilt = new THREE.Group(); b.tilt.quaternion.copy(poleQ(b.pole)); b.grp.add(b.tilt);
  bodies[b.name] = b; list.push(b);
  const lb = document.createElement('div'); lb.className = 'lb ' + (b.kind === 'dwarf' || b.kind === 'etno' || b.kind === 'minor' ? 'planet' : b.kind === 'star' ? 'planet' : b.kind);
  lb.textContent = b.kind === 'hyp' ? 'Planet Nine? · HYPOTHETICAL' : b.name; lb.onclick = (e) => { e.stopPropagation(); App.actions.focus(b.name); };
  document.getElementById('labels').appendChild(lb); b.lb = lb;
  return b;
}
// Sun
const sun = add({ name: 'Sun', kind: 'star', R: 695700, mass: 1.989e30, rot: 609.12, pole: [286.13, 63.87], disc: '—', moons: 0 });
const sunMat = new THREE.ShaderMaterial({ vertexShader: GL.vert, fragmentShader: GL.sunFrag, uniforms: { uTime: { value: 0 } } });
sun.mesh = new THREE.Mesh(sphereGeo[2], sunMat); sun.tilt.add(sun.mesh);
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,230,180,1)'); r.addColorStop(.12, 'rgba(255,190,110,.55)'); r.addColorStop(.35, 'rgba(255,140,60,.12)'); r.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
sun.grp.add(corona);
// Planets
for (const p of D.planets) {
  const b = add({ ...p, kind: 'planet', el: D.standish[p.name] });
  b.mesh = new THREE.Mesh(sphereGeo[2], planetMat(p.type, p.c, p.atm, hash(p.name, 1) * 10)); b.tilt.add(b.mesh);
  b.mesh.material.uniforms.uKind.value = { Mercury: 1, Venus: 2, Mars: 3, Jupiter: 4, Saturn: 5, Uranus: 6, Neptune: 7 }[p.name] || 0;
  const IAU = { Mercury: [329.5469, 6.1385108], Venus: [160.20, -1.4813688], Earth: [190.147, 360.9856235], Mars: [176.630, 350.89198226], Jupiter: [284.95, 870.536], Saturn: [38.90, 810.7939024], Uranus: [203.81, -501.1600928], Neptune: [249.978, 541.1397757] }[p.name];
  if (IAU) { b.W0 = IAU[0]; b.Wd = IAU[1]; }
  b.flat = { Earth: 0.00335, Mars: 0.00589, Jupiter: 0.06487, Saturn: 0.09796, Uranus: 0.0229, Neptune: 0.0171 }[p.name] || 0; // NSSDC flattening
  if (p.ring) {
    const g = new THREE.RingGeometry(p.ring[0], p.ring[1], 160, 1);
    const sat = p.name === 'Saturn' ? 1 : p.name === 'Uranus' ? 2 : p.name === 'Neptune' ? 3 : 0;
    b.ringMat = new THREE.ShaderMaterial({ vertexShader: GL.ringVert, fragmentShader: GL.ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uSun: { value: new THREE.Vector3() }, uPlanet: { value: new THREE.Vector4() }, uCol: { value: new THREE.Color(p.ring[3]) }, uAlpha: { value: sat === 1 ? 1 : sat ? 1 : p.ring[2] }, uSat: { value: sat }, uNorm: { value: new THREE.Vector3() } } });
    b.ring = new THREE.Mesh(g, b.ringMat); b.ring.rotation.x = -Math.PI / 2; b.tilt.add(b.ring);
    if (sat === 1) { // diffuse E ring (3–8 Rs, fed by Enceladus' plumes, peak at Enceladus' orbit ~4 Rs)
      const em = new THREE.ShaderMaterial({ vertexShader: GL.ringVert, fragmentShader: GL.ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { uSun: { value: new THREE.Vector3() }, uPlanet: { value: new THREE.Vector4() }, uCol: { value: new THREE.Color('#9fb6d8') }, uAlpha: { value: 1 }, uSat: { value: 4 }, uNorm: { value: new THREE.Vector3() } } });
      const pm = new THREE.ShaderMaterial({ vertexShader: GL.ringVert, fragmentShader: GL.ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { uSun: { value: new THREE.Vector3(1e9, 0, 0) }, uPlanet: { value: new THREE.Vector4() }, uCol: { value: new THREE.Color('#8a7a68') }, uAlpha: { value: .05 }, uSat: { value: 0 }, uNorm: { value: new THREE.Vector3(0, 1, 0) } } });
      b.pRing = new THREE.Mesh(new THREE.RingGeometry(59, 300, 128, 1), pm); b.pRing.rotation.x = -Math.PI / 2; b.grp.add(b.pRing);
      b.eRing = new THREE.Mesh(new THREE.RingGeometry(3, 8, 160, 1), em); b.eRing.rotation.x = -Math.PI / 2; b.tilt.add(b.eRing); b.eRingMat = em;
    }
  }
}
// Dwarfs, eTNOs, comets
for (const o of D.small) {
  const b = add({ ...o });
  const col = new THREE.Color(o.c);
  b.mesh = new THREE.Mesh(sphereGeo[1], o.kind === 'comet' ? new THREE.MeshBasicMaterial({ color: col }) : planetMat(0, [col.getStyle(), col.clone().multiplyScalar(.6).getStyle(), '#ffffff'], null, hash(o.name, 2) * 10));
  if (o.axes) b.mesh.scale.set(o.axes[0], o.axes[2], o.axes[1]);
  { const SK = { Pluto: 15, Ceres: 16 }[o.name]; if (SK && b.mesh.material.uniforms) b.mesh.material.uniforms.uKind.value = SK; }
  b.tilt.add(b.mesh);
  if (o.ring) {
    const r = o.ring / o.R; const g = new THREE.RingGeometry(r - .04, r + .04, 96, 1);
    b.ringMat = new THREE.ShaderMaterial({ vertexShader: GL.ringVert, fragmentShader: GL.ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uSun: { value: new THREE.Vector3() }, uPlanet: { value: new THREE.Vector4() }, uCol: { value: new THREE.Color('#bbb') }, uAlpha: { value: .5 }, uSat: { value: 0 }, uNorm: { value: new THREE.Vector3() } } });
    b.ring = new THREE.Mesh(g, b.ringMat); b.ring.rotation.x = -Math.PI / 2; b.tilt.add(b.ring);
  }
  if (o.kind === 'comet') {
    const n = 90, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const cc = new Float32Array(n * 3); for (let k = 0; k < n; k++) { const f = 1 - k / n; cc.set(k % 2 ? [1 * f, .82 * f, .55 * f] : [.55 * f, .85 * f, 1 * f], k * 3); } g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    b.tail = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    b.tail.frustumCulled = false; scene.add(b.tail); b.tailSeed = Array.from({ length: n }, (_, k) => [hash(o.name, k) - .5, hash(o.name, k + 500) - .5]);
  }
}
// Moons
for (const m of D.moons) {
  const [name, parent, a, R, P, inc, e] = m;
  if (!bodies[parent] || bodies[name]) { console.warn('Atlas: skipped moon', name); continue; }
  const b = add({ name, parent, a, R, P, inc, e: e || 0, kind: 'moon', node: hash(name, 3) * 2 * Math.PI, phase: hash(name, 4) * 2 * Math.PI, moons: 0 });
  b.mesh = new THREE.Mesh(sphereGeo[R > 400 ? 1 : 0], planetMat(0, R > 1500 && name !== 'Callisto' ? ['#c9b48a', '#8a7552', '#f0e6c8'] : ['#a8a39c', '#6c6862', '#d8d4ce'], null, hash(name, 5) * 10));
  if (name === 'Io') b.mesh.material.uniforms.c1.value.set('#e6c84f'), b.mesh.material.uniforms.c2.value.set('#b0702a'), b.mesh.material.uniforms.uKind.value = 9;
  if (name === 'Europa') b.mesh.material.uniforms.c1.value.set('#e8e0d0'), b.mesh.material.uniforms.c2.value.set('#9a6a48');
  if (name === 'Titan') b.mesh.material.uniforms.c1.value.set('#d9a24a'), b.mesh.material.uniforms.c2.value.set('#b98238');
  const MK = { Europa: 10, Ganymede: 11, Callisto: 11, Iapetus: 12, Enceladus: 13, Titan: 14 }[name]; if (MK) b.mesh.material.uniforms.uKind.value = MK;
  if (name === 'Callisto') b.mesh.material.uniforms.c1.value.set('#6e655a'), b.mesh.material.uniforms.c2.value.set('#3e3832');
  if (name === 'Titan') b.mesh.material.uniforms.uAtm.value.set(1, .7, .35), b.mesh.material.uniforms.uAtmK.value = 1.2;
  { const MC = { Triton: ['#dcc6b8', '#a3877a'], Rhea: ['#d2cdc5', '#8d8880'], Dione: ['#dbd7d1', '#8a8680'], Tethys: ['#ebe8e3', '#a5a19b'], Mimas: ['#cbc8c2', '#7e7a74'], Oberon: ['#8f857c', '#5c544c'], Umbriel: ['#5e5a56', '#3a3734'], Ariel: ['#c2bdb7', '#807b75'], Titania: ['#a89f96', '#6a625a'], Miranda: ['#b8b4ae', '#76726c'], Charon: ['#a9a39d', '#6b5a52'], Phoebe: ['#4a4643', '#2e2b29'], Hyperion: ['#bba892', '#7a6650'], Dysnomia: ['#5a5652', '#3a3734'], Amalthea: ['#a5503a', '#6e3424'], 'Hiʻiaka': ['#e8e6e2', '#a8a6a2'], Nereid: ['#8c8884', '#5a5754'], Proteus: ['#5c5854', '#3a3734'] }[name];
    if (MC) { b.mesh.material.uniforms.c1.value.set(MC[0]); b.mesh.material.uniforms.c2.value.set(MC[1]); } }
  b.locked = Math.abs(P) < 100 && name !== 'Hyperion'; // synchronous rotation (Hyperion tumbles chaotically)
  b.tilt.add(b.mesh);
}
const moonEarth = add({ name: 'Moon', parent: 'Earth', a: 384400, R: 1737.4, P: 27.3217, kind: 'moon', mass: 7.346e22, disc: '—', moons: 0 });
moonEarth.mesh = new THREE.Mesh(sphereGeo[1], planetMat(0, ['#b8b4ac', '#6f6b66', '#e0ddd6'], null, 7.3)); moonEarth.tilt.add(moonEarth.mesh); moonEarth.mesh.material.uniforms.uKind.value = 8;
// Spacecraft
for (const c of D.craft) {
  const b = add({ ...c, kind: 'craft', R: 0.003, disc: 'Launched ' + c.launch, moons: 0 });
  b.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0x7fd4ff })); b.mesh.scale.setScalar(.25); b.tilt.add(b.mesh);
}
const jwst = add({ name: 'JWST', kind: 'craft', R: 0.003, disc: 'Launched Dec 2021 · halo orbit at Sun–Earth L2, 1.5 million km beyond Earth', moons: 0, l2: true });
jwst.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0xffd48a })); jwst.mesh.scale.setScalar(.25); jwst.tilt.add(jwst.mesh);
// Sun–Earth Lagrange points (L1/L2 ≈ 0.01 AU, L3 opposite, L4/L5 ±60° along Earth's orbit)
for (const [n, lp, note] of [['Sun–Earth L1', 1, 'SOHO, DSCOVR and Aditya-L1 watch the Sun from here'], ['Sun–Earth L2', 2, 'JWST, Gaia and Euclid orbit here, 1.5 million km beyond Earth'], ['Sun–Earth L3', 3, 'Hidden behind the Sun; empty'], ['Sun–Earth L4', 4, 'Trojan point 60° ahead; 2010 TK7 librates around it'], ['Sun–Earth L5', 5, 'Trojan point 60° behind; ESA Vigil will go here (2031)']]) {
  const b = add({ name: n, kind: 'lagrange', R: 0.003, disc: note, moons: 0, lp });
  b.mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0x9fe0b0, wireframe: true })); b.mesh.scale.setScalar(.25); b.tilt.add(b.mesh);
}
for (const [n, ang, note] of [['Sun–Jupiter L4', 60, 'Leading Trojan swarm (Greek camp), ~60° ahead of Jupiter'], ['Sun–Jupiter L5', -60, 'Trailing Trojan swarm (Trojan camp), ~60° behind Jupiter']]) {
  const b = add({ name: n, kind: 'lagrange', R: 0.003, disc: note, moons: 0, jl: ang });
  b.mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0xc7a26a, wireframe: true })); b.mesh.scale.setScalar(.25); b.tilt.add(b.mesh);
}
const bary = add({ name: 'Solar System barycentre', kind: 'lagrange', R: 0.003, disc: 'Centre of mass of the Sun and planets, computed live; wanders up to ~2 solar radii from the Sun’s centre, mostly from Jupiter and Saturn', moons: 0, bary: true });
bary.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0xffe08a, wireframe: true })); bary.mesh.scale.setScalar(.25); bary.tilt.add(bary.mesh);
// Planet Nine (HYPOTHETICAL)
const p9 = add({ name: 'Planet Nine', kind: 'hyp', R: 6371 * 2.3, disc: 'Proposed 2016 · Batygin & Brown', moons: 0 });
p9.mesh = new THREE.Mesh(sphereGeo[1], new THREE.MeshBasicMaterial({ color: 0xff8fb8, transparent: true, opacity: .45, wireframe: true })); p9.tilt.add(p9.mesh);
const p9El = () => { const o = D.p9[S.p9]; return { a: o.a, e: o.e, i: o.i * D2R, O: o.O * D2R, w: (o.varpi - o.O) * D2R }; };

// ---------- environment ----------
const belts = App.Belts.build(THREE); belts.forEach(p => scene.add(p.obj));
let oort = null, ts = null, hp = null, gravRing = null;
const sky = App.Belts.sky(THREE); scene.add(sky.grp);
const regions = [['Main belt', [2.7, 0, 0.3], 'belts'], ['Kuiper belt', [0, 45, 3], 'kuiper'], ['Scattered disk', [-140, -60, 20], 'kuiper'], ['Termination shock (est.)', null, 'helio', 'ts'], ['Heliopause (est.)', null, 'helio', 'hp'],
  ['Hills cloud · inner Oort', [4000, 3000, 900], 'oort'], ['Outer Oort cloud', [-50000, 30000, 25000], 'oort'], ['Sun’s gravitational edge ~1–2 ly (est.)', [126000, 0, 0], 'oort']].map(r => {
  const lb = document.createElement('div'); lb.className = 'lb region'; lb.textContent = r[0]; document.getElementById('labels').appendChild(lb);
  let h = r[1]; if (!h) { const L = D.helio.nose[0] * D2R, B = D.helio.nose[1] * D2R, R0 = r[3] === 'ts' ? D.helio.ts : D.helio.hp; h = [Math.cos(B) * Math.cos(L) * R0, Math.cos(B) * Math.sin(L) * R0, Math.sin(B) * R0]; }
  return { lb, h, layer: r[2], sp: new THREE.Vector3() };
});
function buildEnv() {
  [oort, ts, hp, gravRing].forEach(o => { if (o) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); } });
  oort = App.Belts.oort(THREE, mapAU); scene.add(oort);
  ts = App.Belts.bubble(THREE, mapAU, D.helio.ts, 0x4a7fd0, 0.1); hp = App.Belts.bubble(THREE, mapAU, D.helio.hp, 0x6f8fe0, 0.18); scene.add(ts, hp);
  const pts = []; for (let k = 0; k <= 256; k++) { const t = k / 256 * 2 * Math.PI; pts.push(mapAU([Math.cos(t) * 126000, Math.sin(t) * 126000, 0], new THREE.Vector3())); }
  gravRing = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x55657f, dashSize: 4, gapSize: 4, transparent: true, opacity: .6 }));
  gravRing.computeLineDistances(); scene.add(gravRing);
  regions.forEach(r => mapAU(r.h, r.sp));
}

// ---------- orbits (threejs-skills/geometry: Line from points, LineDashedMaterial) ----------
const orbitGrp = new THREE.Group(); scene.add(orbitGrp); let orbitJd = -1e9;
const moonOrbits = [];
function orbitPts(fn, n, closed) { const pts = []; for (let k = 0; k <= n; k++) pts.push(mapAU(fn(k / n), new THREE.Vector3())); return pts; }
function buildOrbits(jd) {
  orbitGrp.children.slice().forEach(o => { o.geometry.dispose(); o.material.dispose(); orbitGrp.remove(o); });
  moonOrbits.forEach(o => { o.parent && o.parent.remove(o); o.geometry.dispose(); o.material.dispose(); }); moonOrbits.length = 0;
  const line = (pts, color, op, dashed, tag) => { const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = dashed ? new THREE.LineDashedMaterial({ color, transparent: true, opacity: op, dashSize: dashed, gapSize: dashed }) : new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });
    const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); l.frustumCulled = false; l.userData.tag = tag; orbitGrp.add(l); return l; };
  const ell = (k) => (t) => { const Ea = t * 2 * Math.PI; return E.rot(k.a * (Math.cos(Ea) - k.e), k.a * Math.sqrt(1 - k.e * k.e) * Math.sin(Ea), k.i, k.O, k.w); };
  for (const p of D.planets) line(orbitPts(ell(E.standishEl(D.standish[p.name], jd)), 512), 0x4f6b8f, .55, 0, 'planet');
  for (const o of D.small) {
    const isE = o.kind === 'etno', tag = o.kind === 'comet' ? 'comet' : isE ? 'etno' : 'dwarf';
    const color = o.kind === 'comet' ? 0x4f8f86 : isE ? 0xd0607f : 0x7a6f8f;
    if (o.name === 'Pluto') { line(orbitPts(ell(E.standishEl(D.standish.Pluto, jd)), 512), color, .5, 0, tag); continue; }
    if (o.hyper) { const aa = o.q / (o.e - 1); line(orbitPts((t) => { const H = (t - .5) * 7; return E.rot(aa * (o.e - Math.cosh(H)), aa * Math.sqrt(o.e * o.e - 1) * Math.sinh(H), o.i * D2R, o.O * D2R, o.w * D2R); }, 300), 0xffc890, .6, 0, 'comet'); continue; }
    line(orbitPts(ell({ a: o.a, e: o.e, i: o.i * D2R, O: o.O * D2R, w: o.w * D2R }), 720), color, isE ? .7 : .45, 0, tag);
  }
  line(orbitPts(ell(p9El()), 720), 0xff8fb8, .6, S.scale.dist === 'log' ? 3 : 900, 'p9');
  // moon orbits, in the parent's frame
  for (const b of list) {
    if (b.kind !== 'moon') continue;
    const p = bodies[b.parent], pts = [], tmp = new THREE.Vector3(), loc = new THREE.Vector3();
    for (let k = 0; k <= 160; k++) { moonLocal(b, jd, k / 160, loc); pts.push(moonScale(b, loc, tmp).clone()); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x6f86a8, transparent: true, opacity: .35, depthWrite: false }));
    l.frustumCulled = false; l.userData.moon = b; moonOrbits.push(l); p.grp.add(l);
  }
  orbitJd = jd;
}

// ---------- positions ----------
const _loc = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
function moonLocal(b, jd, frac, out) { // three coords, km, parent-relative
  if (b === moonEarth) {
    const k = E.moonEl(jd), v = frac == null ? E.moonGeo(jd) : E.rot(k.a * (Math.cos(frac * 6.2832) - k.e), k.a * Math.sqrt(1 - k.e * k.e) * Math.sin(frac * 6.2832), k.i, k.O, k.w);
    return out.set(v[0], v[2], -v[1]);
  }
  const GAL = { Io: [106.07719, 203.488955790], Europa: [175.73161, 101.374724735], Ganymede: [120.55883, 50.317609207], Callisto: [84.44459, 21.571071177] }[b.name];
  if (GAL && frac == null) { b.gal = true; b.node = 0; const l = (GAL[0] + GAL[1] * (jd - E.J2000)) * D2R; return out.set(b.a * Math.cos(l), 0, -b.a * Math.sin(l)).applyQuaternion(bodies[b.parent].tilt.quaternion); }
  const M = frac == null ? b.phase + 2 * Math.PI * (jd - E.J2000) / Math.abs(b.P) : frac * 2 * Math.PI;
  const Ea = frac == null ? E.kepler(M, b.e) : M;
  out.set(b.a * (Math.cos(Ea) - b.e), 0, -b.a * Math.sqrt(1 - b.e * b.e) * Math.sin(Ea));
  _e.set(b.inc * D2R, b.node, 0, 'YXZ'); out.applyEuler(_e);
  return out.applyQuaternion(bodies[b.parent].tilt.quaternion);
}
let lambdaJ = 0;
function computePositions(jd) {
  for (const b of list) {
    if (b.kind === 'planet') E.planet(b.el, jd, b.h);
    else if (b.l2) { const e = bodies.Earth.h, r = Math.hypot(e[0], e[1], e[2]) || 1, k = 1 + 0.01 / r; b.h[0] = e[0] * k; b.h[1] = e[1] * k; b.h[2] = e[2] * k; }
    else if (b.kind === 'dwarf' || b.kind === 'etno' || b.kind === 'comet' || b.kind === 'minor' || b.kind === 'probe') { if (b.standish) E.planet(D.standish.Pluto, jd, b.h); else E.small(b, jd, b.h); }
    else if (b.kind === 'craft') E.craft(b, jd, b.h);
    else if (b.jl) { const j = bodies.Jupiter.h, a = b.jl * D2R, c = Math.cos(a), s = Math.sin(a); b.h[0] = j[0] * c - j[1] * s; b.h[1] = j[0] * s + j[1] * c; b.h[2] = j[2]; }
    else if (b.lp) { const e = bodies.Earth.h, r = Math.hypot(e[0], e[1], e[2]) || 1;
      if (b.lp === 1 || b.lp === 2) { const k = 1 + (b.lp === 1 ? -0.01 : 0.01) / r; b.h[0] = e[0] * k; b.h[1] = e[1] * k; b.h[2] = e[2] * k; }
      else if (b.lp === 3) { b.h[0] = -e[0]; b.h[1] = -e[1]; b.h[2] = -e[2]; }
      else { const a = (b.lp === 4 ? 60 : -60) * D2R, c = Math.cos(a), s = Math.sin(a); b.h[0] = e[0] * c - e[1] * s; b.h[1] = e[0] * s + e[1] * c; b.h[2] = e[2]; } }
  }
  const k9 = p9El(); E.rot(k9.a * (-1 - k9.e), 0, k9.i, k9.O, k9.w, p9.h); // drawn at aphelion: its most likely region (position unknown)
  { let mt = sun.mass, x = 0, y = 0, z = 0; for (const p of D.planets) { const q = bodies[p.name]; mt += q.mass; x += q.mass * q.h[0]; y += q.mass * q.h[1]; z += q.mass * q.h[2]; } bary.h[0] = x / mt; bary.h[1] = y / mt; bary.h[2] = z / mt; }
  lambdaJ = E.standishEl(D.standish.Jupiter, jd).L;
  for (const b of list) { if (b.kind !== 'star' && b.kind !== 'moon') mapAU(b.h, b.sp); }
  sun.sp.set(0, 0, 0);
  // Earth from the Earth–Moon barycentre
  const earth = bodies.Earth; moonLocal(moonEarth, jd, null, moonEarth.loc);
  for (const b of list) {
    if (b.kind !== 'moon') continue;
    if (b !== moonEarth) moonLocal(b, jd, null, b.loc);
    const p = bodies[b.parent]; let wB = b.parent === 'Pluto' && b.name === 'Charon' ? 0.8915 : 1;
    if (!trueMode()) wB = 1;
    moonScale(b, _loc.copy(b.loc).multiplyScalar(wB), _m); b.sp.copy(p.sp).add(_m);
    b.h[0] = p.h[0] + b.loc.x / AU_KM; b.h[1] = p.h[1] - b.loc.z / AU_KM; b.h[2] = p.h[2] + b.loc.y / AU_KM;
  }
  const ch = bodies.Charon, pl = bodies.Pluto; if (ch && trueMode()) { moonScale(ch, _loc.copy(ch.loc).multiplyScalar(-0.1085), _m); pl.sp.add(_m); }
  for (const b of list) if (!Number.isFinite(b.sp.x + b.sp.y + b.sp.z)) b.sp.set(0, 0, 0);
  const em = 1 / 82.3; earth.h[0] -= moonEarth.loc.x / AU_KM * em; earth.h[1] += moonEarth.loc.z / AU_KM * em; earth.h[2] -= moonEarth.loc.y / AU_KM * em;
}

// ---------- camera + focus ----------
const F = new THREE.Vector3(), flyOff = new THREE.Vector3(); let targetDist = null, prevFocus = S.camera.focus;
function focusBody() { return bodies[S.camera.focus] || sun; }
function defaultDist(b) { return b === sun ? (S.scale.dist === 'log' ? 560 : 900) : visR(b) * (b.kind === 'planet' ? 9 : 7); }
App.on((what) => {
  if (what === 'focus') { const nb = focusBody(), ob = bodies[prevFocus] || sun; flyOff.add(_loc.copy(nb.sp).sub(ob.sp)); prevFocus = nb.name; targetDist = defaultDist(nb); App.ui.select(nb); try { hint('Following ' + nb.name + (nb.kind === 'hyp' ? ' · hypothetical' : nb.est || nb.posIllustrative ? ' · position estimated' : '') + ' · double-click to zoom in'); } catch (e) {} }
  if (what === 'scale') { buildEnv(); buildOrbits(App.sim.jd); computePositions(App.sim.jd); App.Belts.update(App.sim.jd, mapAU, lambdaJ); targetDist = defaultDist(focusBody()); }
  if (what === 'time' || what === 'layers') App.ui.refresh();
});
controls.addEventListener('end', () => { const s = new THREE.Spherical().setFromVector3(camera.position); App.actions.saveCamera(s.radius, s.theta, s.phi); });

// ---------- picking (screen-space, like threejs-skills/interaction worldToScreen) ----------
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  let best = null, bd = 24;
  for (const b of list) { if (!b.vis) continue; const d = Math.hypot(b.sx - e.clientX, b.sy - e.clientY); if (d < bd) { bd = d; best = b; } }
  if (best) App.actions.focus(best.name);
});
canvas.addEventListener('dblclick', (e) => {
  let best = null, bd = 24;
  for (const b of list) { if (!b.vis) continue; const d = Math.hypot(b.sx - e.clientX, b.sy - e.clientY); if (d < bd) { bd = d; best = b; } }
  if (best) { if (best.name !== S.camera.focus) App.actions.focus(best.name); targetDist = visR(best) * 3.2; }
  else if (S.camera.focus !== 'Sun') App.actions.focus('Sun');
  else targetDist = defaultDist(sun);
});

// ---------- loop ----------
let W = 0, H = 0;
function resize() { W = innerWidth; H = innerHeight; if (!W || !H) return; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let beltT = 0, beltJd = -1, uiT = 0, t = 0;
const scr = new THREE.Vector3(), tmpV = new THREE.Vector3(), _dt = new THREE.Vector3();
function layerOn(b) {
  const L = S.layers;
  if (b.kind === 'moon') return L.moons && S.moonFilter[b.parent] !== false;
  if (b.kind === 'craft' || b.kind === 'probe' || b.kind === 'lagrange') return L.craft; if (b.kind === 'hyp') return L.p9; if (b.kind === 'comet') return L.comets;
  return true;
}
let frameErr = 0;
function frame() {
  requestAnimationFrame(frame);
  try { frameBody(); } catch (e) { if (frameErr++ < 3) console.warn('Atlas frame', e); }
}
function frameBody() {
  if (window.cabinet && cabinet.visible === false) { clock.getDelta(); return; }
  if (!W || !H) { resize(); return; }
  if (glLost) return;
  const dt = Math.min(clock.getDelta(), 0.1); t += dt;
  const ts_ = S.time;
  if (ts_.live && !ts_.paused) App.sim.jd = E.jdNow();
  else if (!ts_.paused) App.sim.jd = Math.max(2086302.5, Math.min(2817152.5, App.sim.jd + dt * ts_.rate / 86400));
  if (!Number.isFinite(App.sim.jd)) { App.sim.jd = E.jdNow(); S.time.live = true; }
  const jd = App.sim.jd;
  { const out = jd < 2378496.5 || jd > 2470172.5; if (out && !frameBody._warned) { frameBody._warned = true; try { hint('Beyond 1800–2050: planet positions are estimates (Standish elements lose accuracy)'); } catch (e) {} } else if (!out) frameBody._warned = false; }
  if (Math.abs(jd - orbitJd) > 3650) buildOrbits(jd);
  computePositions(jd);
  const fb = focusBody();
  flyOff.multiplyScalar(Math.exp(-dt * 2.6)); if (flyOff.lengthSq() < 1e-20) flyOff.set(0, 0, 0);
  F.copy(fb.sp).sub(flyOff);
  // camera distance tween in log space
  if (targetDist) { const d = camera.position.length(), nd = Math.exp(Math.log(d) + (Math.log(targetDist) - Math.log(d)) * Math.min(1, dt * 3)); camera.position.setLength(nd); if (Math.abs(Math.log(nd / targetDist)) < 0.01) targetDist = null; }
  controls.minDistance = visR(fb) * 1.15; controls.update();
  const sunPos = tmpV.copy(sun.sp).sub(F), sunR = visR(sun); const cand = [];
  for (const b of list) {
    const on = layerOn(b); b.grp.visible = on;
    if (!on) { b.vis = false; b.lb.style.display = 'none'; continue; }
    b.grp.position.copy(b.sp).sub(F);
    const r = visR(b); b.mesh.scale.setScalar(r); if (b.axes) b.mesh.scale.set(r * b.axes[0], r * b.axes[2], r * b.axes[1]); if (b.flat) b.mesh.scale.y = r * (1 - b.flat);
    if (b.kind === 'craft' || b.kind === 'hyp' || b.kind === 'lagrange') { const cd = camera.position.distanceTo(b.grp.position); b.mesh.scale.setScalar(b.kind === 'hyp' ? Math.max(r, cd * 0.006) : Math.min(r, cd * 0.006)); }
    if (b.eRing) b.eRing.scale.setScalar(r);
    if (b.pRing) { b.pRing.scale.setScalar(r); b.pRing.visible = S.layers.moons; }
    if (b.ring) b.ring.scale.setScalar(r);
    if (b.W0 != null) b.mesh.rotation.y = ((b.W0 + b.Wd * (jd - E.J2000)) % 360) * D2R;
    else if (b.kind === 'moon' && (b.locked || b === moonEarth) && b.loc) b.mesh.rotation.y = Math.atan2(b.loc.z, -b.loc.x);
    else if (b.rot) b.mesh.rotation.y = ((jd - E.J2000) * 24 / b.rot % 1) * 2 * Math.PI;
    const u = b.mesh.material.uniforms;
    if (u && u.uSun) {
      u.uSun.value.copy(sunPos); u.uTime.value = t; u.uSunR.value = sunR;
      const occ = b._occ || (b._occ = b.kind === 'moon' ? [bodies[b.parent]] : list.filter(m => m.parent === b.name).sort((x, y) => y.R - x.R).slice(0, 4));
      for (let k = 0; k < 4; k++) { const o = occ[k]; if (o && layerOn(o)) u.uOcc.value[k].set(o.sp.x - F.x, o.sp.y - F.y, o.sp.z - F.z, visR(o)); else u.uOcc.value[k].set(0, 0, 0, 0); }
    }
    if (b.ringMat) { const ru = b.ringMat.uniforms; ru.uSun.value.copy(sunPos); ru.uPlanet.value.set(b.grp.position.x, b.grp.position.y, b.grp.position.z, r); ru.uNorm.value.set(0, 1, 0).applyQuaternion(b.tilt.quaternion);
      if (b.eRingMat) { const eu = b.eRingMat.uniforms; eu.uSun.value.copy(sunPos); eu.uPlanet.value.copy(ru.uPlanet.value); eu.uNorm.value.copy(ru.uNorm.value); }
      if (b.name === 'Saturn' && u) { u.uRingN.value.copy(ru.uNorm.value); u.uRingC.value.set(b.grp.position.x, b.grp.position.y, b.grp.position.z, r); } }
    // label + screen position
    scr.copy(b.grp.position).project(camera);
    const sx = (scr.x * .5 + .5) * W, sy = (-scr.y * .5 + .5) * H; b.sx = sx; b.sy = sy;
    let show = scr.z < 1 && sx > -50 && sx < W + 50 && sy > -20 && sy < H + 20;
    b.vis = show;
    if (b.kind === 'moon') { const p = bodies[b.parent]; const near = S.camera.focus === b.parent || S.camera.focus === b.name || camera.position.distanceTo(p.grp.position) < visR(p) * 120; if (!near || Math.hypot(sx - p.sx, sy - p.sy) < 10) show = false; }
    if (b.kind === 'lagrange' && !b.bary && !b.jl && camera.position.distanceTo(bodies.Earth.grp.position) > 400) show = false;
    if ((b.kind === 'etno' || b.kind === 'dwarf') && b.name !== 'Pluto' && b.name !== 'Ceres' && !(S.layers.kuiper || S.layers.p9)) show = false;
    show = show && S.layers.labels;
    if (show) cand.push(b); else b.lb.style.display = 'none';
  }
  // label declutter: priority order, skip overlapping boxes
  const PRI = { star: 0, planet: 1, dwarf: 2, craft: 3, comet: 4, etno: 4, minor: 4, hyp: 3, moon: 5, lagrange: 6, probe: 4 };
  const cardEl = document.getElementById('card'), cr = cardEl && !cardEl.hidden ? cardEl.getBoundingClientRect() : null;
  cand.sort((x, y) => (x === fb ? -1 : y === fb ? 1 : (PRI[x.kind] - PRI[y.kind]) || (y.R - x.R)));
  const placed = [];
  for (const b of cand) {
    const w = 10 + b.name.length * 6.2, x0 = b.sx, y0 = b.sy - 8, x1 = x0 + w, y1 = y0 + 14;
    if (b !== fb && placed.some(r => x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1])) { b.lb.style.display = 'none'; continue; }
    if (b !== fb && (x1 > W - 4 || x0 < 2 || (x1 > W - 190 && y0 < 48) || y1 > H - 70 || (cr && cr.width && x0 < cr.right && x1 > cr.left && y0 < cr.bottom && y1 > cr.top))) { b.lb.style.display = 'none'; continue; }
    placed.push([x0, y0, x1, y1]); if (b.lb.style.display) b.lb.style.display = '';
    const tr = `translate(${Math.min(b.sx, W - w).toFixed(0)}px,${(b.sy - 7).toFixed(0)}px)`; if (b._tr !== tr) { b.lb.style.transform = tr; b._tr = tr; }
    const sel = b === fb; if (b._sel !== sel) { b.lb.classList.toggle('sel', sel); b._sel = sel; }
  }
  sun.mesh.material.uniforms.uTime.value = t; corona.scale.setScalar(sunR * 9);
  // comet tails: anti-sunward, length ~ 1/r²
  for (const b of list) {
    if (!b.tail) continue; const r = Math.hypot(...b.h); const on = S.layers.comets && r < 6; b.tail.visible = on; if (!on) continue;
    const arr = b.tail.geometry.attributes.position.array, len = Math.min(0.9, 0.35 / (r * r));
    const a = b.grp.position, tip = mapAU([b.h[0] * (1 + len / r), b.h[1] * (1 + len / r), b.h[2] * (1 + len / r)], tmpV).sub(F).sub(a);
    const sp = tip.length() * 0.06;
    // dust tail: curves back along the orbit (opposite the motion); ion tail (blue) stays straight anti-sunward
    const ph = E.small(b, jd - 2, [0, 0, 0]), vx = b.h[0] - ph[0], vy = b.h[1] - ph[1], vz = b.h[2] - ph[2], vl = Math.hypot(vx, vy, vz) || 1, kd = len * 0.55 / vl, kr = 1 + len * 0.75 / r;
    const dTip = mapAU([b.h[0] * kr - vx * kd, b.h[1] * kr - vy * kd, b.h[2] * kr - vz * kd], new THREE.Vector3()).sub(F).sub(a);
    for (let k = 0; k < b.tailSeed.length; k++) { const f = k / b.tailSeed.length, s = b.tailSeed[k], T = k % 2 ? _dt.copy(tip).lerp(dTip, f) : tip, w = k % 2 ? 2.2 : 1; arr[k * 3] = a.x + T.x * f + s[0] * sp * f * w; arr[k * 3 + 1] = a.y + T.y * f + s[1] * sp * f * w; arr[k * 3 + 2] = a.z + T.z * f + (s[0] - s[1]) * sp * f * w; }
    b.tail.geometry.attributes.position.needsUpdate = true;
  }
  // environment visibility + floating origin
  beltT += dt; if (beltT > 0.1 && (jd !== beltJd)) { App.Belts.update(jd, mapAU, lambdaJ); beltT = 0; beltJd = jd; }
  if (belts.some(p => p.stale && S.layers[p.layer])) { App.Belts.update(jd, mapAU, lambdaJ); beltJd = jd; }
  belts.forEach(p => { p.obj.visible = S.layers[p.layer]; p.obj.position.copy(F).negate(); });
  [oort, gravRing].forEach(o => { o.visible = S.layers.oort; o.position.copy(F).negate(); });
  [ts, hp].forEach(o => { o.visible = S.layers.helio; o.position.copy(F).negate(); });
  orbitGrp.position.copy(F).negate(); orbitGrp.visible = S.layers.orbits;
  orbitGrp.children.forEach(l => { const g = l.userData.tag; l.visible = g === 'p9' ? S.layers.p9 : g === 'comet' ? S.layers.comets : g === 'etno' ? (S.layers.kuiper || S.layers.p9) : true;
    if (g === 'etno') l.material.color.setHex(S.layers.p9 ? 0xff5f8f : 0xd0607f); });
  moonOrbits.forEach(l => { const m = l.userData.moon, p = bodies[m.parent]; l.visible = S.layers.orbits && layerOn(m) && camera.position.distanceTo(p.grp.position) < visR(p) * 200; });
  regions.forEach(r => { scr.copy(r.sp).sub(F).project(camera); const sx = (scr.x * .5 + .5) * W, sy = (-scr.y * .5 + .5) * H;
    const rw = r.lb.textContent.length * 5.6 + 8; let show = S.layers.labels && S.layers[r.layer] && scr.z < 1 && sx > 0 && sx < W - 10 - rw && sy > 50 && sy < H - 90 && !(sx > W - 230 && sy < 90);
    if (show && placed.some(q => sx < q[2] && sx + rw > q[0] && sy - 2 < q[3] && sy + 14 > q[1])) show = false; if (show) placed.push([sx, sy - 2, sx + rw, sy + 14]); r.lb.style.display = show ? '' : 'none'; if (show) r.lb.style.transform = `translate(${sx.toFixed(0)}px,${sy.toFixed(0)}px)`; });
  sky.grp.position.copy(camera.position); sky.grp.visible = S.layers.stars; sky.milky.visible = S.layers.milky;
  renderer.render(scene, camera);
  uiT += dt; if (uiT > 0.25) { uiT = 0; App.ui.tick(fb, camera.position.length(), camera.fov, H); }
}

// ---------- start ----------
buildEnv(); computePositions(App.sim.jd); buildOrbits(App.sim.jd); App.Belts.update(App.sim.jd, mapAU, lambdaJ);
{ const fb = focusBody(), c = S.camera, d = (Number.isFinite(c.dist) && c.dist > 0 && c.dist < 2e8) ? c.dist : defaultDist(fb); camera.position.setFromSpherical(new THREE.Spherical(d, c.el && c.el > 0.05 ? c.el : 1.15, c.az || 0.6)); controls.update(); }
App.ui.init({ bodies, list, trueMode, visR, logF });
App.ui.select(focusBody(), true);
document.getElementById('loading').remove();
requestAnimationFrame(frame);
try { if (window.cabinet && cabinet.actions && cabinet.actions.define) { cabinet.actions.define('distanceBetween', { description: 'How far apart two bodies are at the Atlas date (e.g. Earth and Mars), with light-travel time', readOnly: true,
  input: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } }, (a) => {
  const find = (n) => bodies[Object.keys(bodies).find(k => k.toLowerCase() === String(n || '').trim().toLowerCase())];
  const x = find(a.from), y = find(a.to); if (!x || !y) throw new Error('I could not find ' + (!x ? a.from : a.to) + ' in the Atlas.');
  computePositions(App.sim.jd); const au = Math.hypot(x.h[0] - y.h[0], x.h[1] - y.h[1], x.h[2] - y.h[2]);
  const date = E.jdToDate(App.sim.jd).toISOString().slice(0, 10);
  return { message: `${x.name} to ${y.name}: ${au.toFixed(3)} AU (${Math.round(au * AU_KM).toLocaleString()} km), ${E.lightTime(au)} on ${date}.`, au, km: au * AU_KM, date };
});
  cabinet.actions.define('whereIs', { description: 'Where a body is right now in the Atlas: distance from the Sun and from Earth, light-travel time', readOnly: true,
    input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } }, (a) => {
    const k = Object.keys(bodies).find(n => n.toLowerCase() === String(a.name || '').trim().toLowerCase()); if (!k) throw new Error('I could not find ' + a.name + ' in the Atlas.');
    try { computePositions(App.sim.jd); } catch (er) { throw new Error('Positions could not be computed for that date.'); } const b = bodies[k], e = bodies.Earth;
    const rs = Math.hypot(...b.h), re = Math.hypot(b.h[0] - e.h[0], b.h[1] - e.h[1], b.h[2] - e.h[2]);
    const date = E.jdToDate(App.sim.jd).toISOString().slice(0, 10), est = b.kind === 'hyp' || b.est || b.posIllustrative ? ' (estimate)' : '';
    return { message: `${k} on ${date}: ${rs.toFixed(3)} AU from the Sun, ${re.toFixed(3)} AU from Earth (${E.lightTime(re)})${est}.`, fromSunAU: rs, fromEarthAU: re, date };
  });
  const nrm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f\u02bb'’]/g, '').trim().toLowerCase();
  const findName = (n) => Object.keys(bodies).find(k => nrm(k) === nrm(n));
  cabinet.actions.define('flyTo', { description: 'Fly the Atlas camera to a body and follow it (e.g. Saturn, Titan, Voyager 1)', input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } }, (a) => {
    const k = findName(a.name); if (!k) throw new Error('I could not find ' + a.name + ' in the Atlas.'); App.actions.focus(k); return { message: 'Following ' + k + '.' }; });
  cabinet.actions.define('setDate', { description: 'Jump the Atlas to a date (YYYY-MM-DD, 1000–3000 AD), or "now"', input: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] } }, (a) => {
    if (/^now$/i.test(String(a.date).trim())) { App.actions.now(); return { message: 'Back to now.' }; }
    const jd = App.actions.jumpTo(a.date); return { message: 'Atlas set to ' + E.jdToDate(jd).toISOString().slice(0, 10) + '.' }; });
  cabinet.actions.define('toggleLayer', { description: 'Show or hide an Atlas layer: orbits, labels, moons, belts, kuiper, oort, helio, p9, craft, comets, stars, milky', input: { type: 'object', properties: { layer: { type: 'string' }, on: { type: 'boolean' } }, required: ['layer'] } }, (a) => {
    const k = String(a.layer || '').trim().toLowerCase().replace('planet nine', 'p9').replace('heliosphere', 'helio').replace('spacecraft', 'craft').replace('milky way', 'milky');
    const v = App.actions.toggleLayer(k, typeof a.on === 'boolean' ? a.on : undefined); return { message: k + (v ? ' shown.' : ' hidden.'), on: v }; });
  cabinet.actions.define('setSpeed', { description: 'Set Atlas time speed in days per second (negative runs backward, max 365)', input: { type: 'object', properties: { daysPerSecond: { type: 'number' } }, required: ['daysPerSecond'] } }, (a) => {
    const d = Number(a.daysPerSecond); if (!Number.isFinite(d)) throw new Error('That speed could not be read.'); App.actions.setRate(d * 86400); return { message: 'Speed set to ' + (S.time.rate / 86400).toFixed(2) + ' days/s.' }; });
} } catch (e) { console.warn(e); }
// keyboard shortcuts with feedback
function hint(t) { let el = document.getElementById('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = t; el.classList.add('show'); clearTimeout(hint._t); hint._t = setTimeout(() => el.classList.remove('show'), t.length > 60 ? 4000 : 1400); }
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
  const k = e.key; let msg = '';
  try {
    if (k === ' ') { App.actions.togglePause(); msg = S.time.paused ? 'Paused' : 'Playing'; }
    else if (k === 'n' || k === 'N') { App.actions.now(); msg = 'Back to now'; }
    else if (k === 'r' || k === 'R') { App.actions.reverse(); msg = S.time.rate < 0 ? 'Running backward' : 'Running forward'; }
    else if (k === '/') { const s = document.getElementById('search'); if (s) s.focus(); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') { const seq = ['Sun', ...D.planets.map(p => p.name), 'Pluto']; let i = seq.indexOf(S.camera.focus); i = (i < 0 ? 0 : i + (k === 'ArrowRight' ? 1 : seq.length - 1)) % seq.length; App.actions.focus(seq[i]); msg = 'Following ' + seq[i]; }
    else if (k === 'Escape' && S.camera.focus !== 'Sun') { App.actions.focus('Sun'); msg = 'Back to the Sun'; }
    else if (k === 'h' || k === 'H') { App.actions.focus('Sun'); msg = 'Back to the Sun'; }
    else if (k === '?') { msg = 'Space pause · N now · R reverse · [ ] speed · ← → or 1–9 planets · H/Esc Sun · L labels · M moons · O orbits · C comets · B belts · K Kuiper · P Planet Nine · / search'; }
    else if (/^[1-9]$/.test(k)) { const n = [...D.planets.map(p => p.name), 'Pluto'][+k - 1]; App.actions.focus(n); msg = 'Following ' + n; }
    else if (k === 'm' || k === 'M') { msg = 'Moons ' + (App.actions.toggleLayer('moons') ? 'on' : 'off'); }
    else if (k === 'o' || k === 'O') { msg = 'Orbits ' + (App.actions.toggleLayer('orbits') ? 'on' : 'off'); }
    else if (k === 'c' || k === 'C') { msg = 'Comets ' + (App.actions.toggleLayer('comets') ? 'on' : 'off'); }
    else if (k === 'b' || k === 'B') { msg = 'Belts ' + (App.actions.toggleLayer('belts') ? 'on' : 'off'); }
    else if (k === 'p' || k === 'P') { msg = 'Planet Nine ' + (App.actions.toggleLayer('p9') ? 'on' : 'off'); }
    else if (k === 'k' || k === 'K') { msg = 'Kuiper belt ' + (App.actions.toggleLayer('kuiper') ? 'on' : 'off'); }
    else if (k === 'l' || k === 'L') { msg = 'Labels ' + (App.actions.toggleLayer('labels') ? 'on' : 'off'); }
    else if (k === ']' || k === '[') { App.actions.setRate(S.time.rate * (k === ']' ? 4 : 0.25)); msg = (S.time.rate / 86400).toFixed(3) + ' days/s'; }
    else return;
  } catch (er) { msg = er.message; }
  e.preventDefault(); if (msg) hint(msg);
});
try { if (window.cabinet && cabinet.actions && cabinet.actions.define) cabinet.actions.define('listMoons', { description: 'List the moons the Atlas has for a planet or dwarf planet, largest first', readOnly: true,
  input: { type: 'object', properties: { parent: { type: 'string' } }, required: ['parent'] } }, (a) => {
  const p = Object.keys(bodies).find(k => k.toLowerCase() === String(a.parent || '').trim().toLowerCase()); if (!p) throw new Error('I could not find ' + a.parent + ' in the Atlas.');
  const ms = list.filter(b => b.kind === 'moon' && b.parent === p).sort((x, y) => y.R - x.R);
  const known = bodies[p].moons;
  return { message: ms.length ? `${p}: ${ms.length} moons in the Atlas${known > ms.length ? ' (of ' + known + ' known)' : ''}. Largest: ${ms.slice(0, 6).map(m => m.name).join(', ')}.` : `${p} has no moons in the Atlas.`, count: ms.length, known, names: ms.map(m => m.name) };
}); } catch (e) { console.warn(e); }
try { if (window.cabinet) {
  if (cabinet.describeMemory) cabinet.describeMemory({ atlas: 'Atlas settings { v:1, time:{live,jd,rate (sim s per s),paused}, camera:{focus,dist,az,el}, layers:{name:bool}, moonFilter:{parent:false}, scale:{size:visible|true,dist:log|linear}, p9:brief|bb2021, tab, card, cardMini, recent:[names] }' });
  if (cabinet.onMemory) cabinet.onMemory((m) => { const a = m && m.atlas; if (!a || typeof a !== 'object') return;
    if (a.layers) for (const k in S.layers) if (typeof a.layers[k] === 'boolean' && a.layers[k] !== S.layers[k]) App.actions.toggleLayer(k, a.layers[k]);
    if (a.camera && typeof a.camera.focus === 'string' && a.camera.focus !== S.camera.focus && bodies[a.camera.focus]) App.actions.focus(a.camera.focus); });
  addEventListener('pagehide', () => { try { S.time.jd = App.sim.jd; cabinet.remember('atlas', S); } catch (e) {} });
} } catch (e) { console.warn(e); }
