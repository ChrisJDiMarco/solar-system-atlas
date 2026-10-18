window.App = window.App || {};
// Particle populations: representative distributions (seeded), solved with Kepler on the CPU at ≤10 Hz.
App.Belts = (function () {
  const D2R = Math.PI / 180, K = 0.01720209895;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(20261017);
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pops = [];
  function pop(name, layer, color, size, n, gen, opacity) {
    const el = new Float64Array(n * 6), trojan = new Float32Array(n);
    for (let k = 0; k < n; k++) { const o = gen(k); el.set([o.a, o.e, o.i * D2R, o.O * D2R, o.w * D2R, o.M * D2R], k * 6); trojan[k] = o.tro || 0; }
    pops.push({ name, layer, color, size, n, el, trojan, opacity: opacity || .7 });
  }
  const gaps = [[2.502, .03], [2.825, .02], [2.958, .015], [3.279, .045]];
  pop('Main belt', 'belts', 0xa89a88, 1.4, 5000, () => {
    let a; do { a = 2.1 + Math.pow(R(), 1.1) * 1.2; } while (gaps.some(g => Math.abs(a - g[0]) < g[1] * (0.6 + R())));
    return { a, e: Math.abs(gauss()) * .08, i: Math.abs(gauss()) * 7, O: R() * 360, w: R() * 360, M: R() * 360 };
  });
  pop('Jupiter Trojans', 'belts', 0xc7a26a, 1.5, 900, (k) => ({ a: 5.2 + gauss() * .08, e: Math.abs(gauss()) * .06, i: Math.abs(gauss()) * 12, O: R() * 360, w: 0, M: 0, tro: (k % 2 ? 60 : -60) + gauss() * 12 }));
  pop('Neptune Trojans', 'kuiper', 0x9fb4e0, 1.5, 300, (k) => ({ a: 30.07 + gauss() * .15, e: Math.abs(gauss()) * .05, i: Math.abs(gauss()) * 12, O: R() * 360, w: 0, M: 0, tro: (k % 2 ? 60 : -60) + gauss() * 10 }));
  const neptunePop = pops[pops.length - 1]; neptunePop.host = 'Neptune';
  pop('Hildas', 'belts', 0xb6c79a, 1.4, 400, () => ({ a: 3.7 + R() * .5, e: .08 + R() * .2, i: Math.abs(gauss()) * 8, O: R() * 360, w: R() * 360, M: R() * 360 }));
  pop('Hungarias', 'belts', 0xc9b8a0, 1.4, 250, () => ({ a: 1.78 + R() * .22, e: R() * .18, i: 16 + R() * 18, O: R() * 360, w: R() * 360, M: R() * 360 }));
  pop('Near-Earth sample', 'belts', 0xe08a6a, 1.6, 220, () => ({ a: .8 + R() * 1.8, e: .1 + R() * .5, i: Math.abs(gauss()) * 10, O: R() * 360, w: R() * 360, M: R() * 360 }));
  pop('Zodiacal dust', 'belts', 0xe8d9b0, 1.1, 600, () => ({ a: .3 + Math.pow(R(), .7) * 2.7, e: R() * .15, i: Math.abs(gauss()) * 8, O: R() * 360, w: R() * 360, M: R() * 360 }), .25);
  pop('Mars Trojans', 'belts', 0xd08a6a, 1.6, 12, (k) => ({ a: 1.5237 + gauss() * .002, e: Math.abs(gauss()) * .05, i: 18 + gauss() * 8, O: R() * 360, w: 0, M: 0, tro: (k % 4 ? 60 : -60) + gauss() * 8 }));
  pops[pops.length - 1].host = 'Mars';
  pop('Centaurs', 'belts', 0x9ab8c7, 1.6, 260, () => ({ a: 5.5 + Math.pow(R(), 1.4) * 24, e: .1 + R() * .5, i: Math.abs(gauss()) * 15, O: R() * 360, w: R() * 360, M: R() * 360 }));
  pop('Kuiper belt', 'kuiper', 0x8fa6c8, 1.4, 3400, (k) => {
    const t = R();
    if (t < .38) return { a: 42 + R() * 5.5, e: R() * .08, i: Math.abs(gauss()) * 2.5, O: R() * 360, w: R() * 360, M: R() * 360 };
    if (t < .58) return { a: 40 + R() * 8, e: R() * .15, i: Math.abs(gauss()) * 15, O: R() * 360, w: R() * 360, M: R() * 360 };
    if (t < .78) return { a: 39.4 + gauss() * .2, e: .1 + R() * .2, i: Math.abs(gauss()) * 10, O: R() * 360, w: R() * 360, M: R() * 360 };
    return { a: 50 * Math.pow(20, R()), e: .3 + R() * .55, i: Math.abs(gauss()) * 18, O: R() * 360, w: R() * 360, M: R() * 360 };
  });
  function build(THREE) {
    return pops.map(p => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p.n * 3), 3));
      const m = new THREE.PointsMaterial({ color: p.color, size: p.size, sizeAttenuation: false, transparent: true, opacity: p.opacity, depthWrite: false });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; p.obj = pts; return p;
    });
  }
  const out = [0, 0, 0];
  function update(jd, mapAU, lambdaJ) {
    const dt = jd - 2451545;
    const Ls = (App.state && App.state.layers) || {};
    for (const p of pops) {
      if (Ls[p.layer] === false) { p.stale = true; continue; }
      const lamT = p.host ? App.E.standishEl(App.D.standish[p.host], jd).L : lambdaJ;
      p.stale = false;
      const arr = p.obj.geometry.attributes.position.array, el = p.el;
      for (let k = 0; k < p.n; k++) {
        const o = k * 6, a = el[o], e = el[o + 1];
        let M, w = el[o + 4];
        if (p.trojan[k]) { M = lamT + p.trojan[k] * D2R - el[o + 3]; w = 0; }
        else M = el[o + 5] + K / Math.pow(a, 1.5) * dt;
        M = M % (2 * Math.PI);
        let E = M; for (let it = 0; it < 6; it++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        App.E.rot(a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E), el[o + 2], el[o + 3], w, out);
        const v = mapAU(out); arr[k * 3] = v.x; arr[k * 3 + 1] = v.y; arr[k * 3 + 2] = v.z;
      }
      p.obj.geometry.attributes.position.needsUpdate = true;
    }
  }
  // Oort cloud (static over human time): Hills cloud 2,000–20,000 AU flattened; outer shell to 100,000 AU
  function oort(THREE, mapAU) {
    const n = 5000, R2 = rng(77), pos = new Float32Array(n * 3), v = [0, 0, 0];
    for (let k = 0; k < n; k++) {
      const inner = k < 2200, r = inner ? 2000 * Math.pow(10, R2()) : 20000 * Math.pow(5, R2());
      const u = R2() * 2 - 1, ph = R2() * 6.2832, s = Math.sqrt(1 - u * u);
      v[0] = s * Math.cos(ph) * r; v[1] = s * Math.sin(ph) * r; v[2] = u * r * (inner ? .45 : 1);
      const m = mapAU(v); pos[k * 3] = m.x; pos[k * 3 + 1] = m.y; pos[k * 3 + 2] = m.z;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const o = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x7f9bd0, size: 1.3, sizeAttenuation: false, transparent: true, opacity: .45, depthWrite: false }));
    o.frustumCulled = false; return o;
  }
  // Heliosphere bubble: nose toward ISM inflow, tail ~3x (estimate)
  function bubble(THREE, mapAU, R0, color, k) {
    const g = new THREE.SphereGeometry(1, 48, 24), p = g.attributes.position, nose = App.E.radecFromEcl || null;
    const L = App.D.helio.nose[0] * D2R, B = App.D.helio.nose[1] * D2R, nx = Math.cos(B) * Math.cos(L), ny = Math.cos(B) * Math.sin(L), nz = Math.sin(B);
    const v = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      // sphere vertex in three coords -> ecliptic (x, -z, y)
      const ex = p.getX(i), ey = -p.getZ(i), ez = p.getY(i), c = ex * nx + ey * ny + ez * nz;
      const r = R0 * (1 + (1 - c)); v[0] = ex * r; v[1] = ey * r; v[2] = ez * r;
      const m = mapAU(v); p.setXYZ(i, m.x, m.y, m.z);
    }
    g.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({ vertexShader: App.GL.vert, fragmentShader: App.GL.glowFrag, uniforms: { uCol: { value: new THREE.Color(color) }, uK: { value: k } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
  }
  function sky(THREE) {
    const grp = new THREE.Group(), Rr = rng(4242), RAD = 1e7;
    const N = 3600, pos = [], col = [];
    const push = (u, b) => { pos.push(u[0] * RAD, u[2] * RAD, -u[1] * RAD); col.push(b, b, b * 1.05); };
    for (let k = 0; k < N; k++) { // representative field, denser toward galactic plane
      const l = Rr() * 360, b = (Rr() < .45 ? gauss() * 12 : Math.asin(Rr() * 2 - 1) / D2R);
      push(App.E.galToEcl(l, b), .25 + Math.pow(Rr(), 4) * .7);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const field = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .9, depthWrite: false }));
    const bp = [], bc = [];
    for (const s of App.D.stars) { const u = App.E.radec(s[1], s[2]); bp.push(u[0] * RAD, u[2] * RAD, -u[1] * RAD); const b = Math.min(1, 1.25 - s[3] * .25); bc.push(b, b * .97, b * .92); }
    const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); gb.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
    const bright = new THREE.Points(gb, new THREE.PointsMaterial({ size: 2.8, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false }));
    const mp = [], mc = [];
    for (let k = 0; k < 9000; k++) { // Milky Way glow band
      let l = Rr() * 360; const core = Math.cos((l > 180 ? l - 360 : l) * D2R * .5); const b = gauss() * (3 + 5 * (1 - core));
      const u = App.E.galToEcl(l, b); mp.push(u[0] * RAD, u[2] * RAD, -u[1] * RAD); const br = .05 + .1 * core * Rr(); mc.push(br * .9, br * .95, br * 1.15);
    }
    const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); gm.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3));
    const milky = new THREE.Points(gm, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    [field, bright, milky].forEach(o => { o.frustumCulled = false; o.renderOrder = -10; grp.add(o); });
    return { grp, field, bright, milky };
  }
  return { build, update, oort, bubble, sky, pops };
})();
