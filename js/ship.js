// The UFO's saucer: a lathe hull with panel seams, weathering and scorch maps, a chrome lip, a vented belly, a glass
// canopy and an ion wash that streams behind it in proportion to the speed it really makes. build() makes it once
// (procedural, no assets); animate() runs each frame from ufo.js. Everything here is UFO-only.
window.App = window.App || {};
App.ship = (function () {
  const TAU = Math.PI * 2, WASH = 56, GOLDEN = 2.39996;
  let THREE = null, CORE = null, HOT = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  // a seeded generator, so every build of the saucer looks the same
  const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // Hull detail as a bump map: raised plates with a lit top-left bevel and a shadowed bottom-right, a little
  // plate-to-plate variation so it reads as built rather than painted, and rivets (lathe UVs run round the hull in u)
  function panelTex() {
    const w = 1024, h = 256, cv = canvas(w, h), x = cv.getContext('2d'), bands = [0, 0.24, 0.52, 0.8, 1], cols = 24, rnd = rng(7);
    x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < cols; i++) for (let j = 0; j < bands.length - 1; j++) {
      const x0 = i / cols * w + 2, x1 = (i + 1) / cols * w - 2, y0 = bands[j] * h + 2, y1 = bands[j + 1] * h - 2, s = 120 + Math.floor(rnd() * 14);
      x.fillStyle = `rgb(${s},${s},${s})`; x.fillRect(x0, y0, x1 - x0, y1 - y0);
      x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(x0, y0, x1 - x0, 2); x.fillRect(x0, y0, 2, y1 - y0);
      x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(x0, y1 - 2, x1 - x0, 2); x.fillRect(x1 - 2, y0, 2, y1 - y0);
    }
    x.fillStyle = '#d4d4d4';
    for (let i = 0; i < cols; i++) for (const v of [0.12, 0.38, 0.66, 0.92]) { x.beginPath(); x.arc((i + 0.5) / cols * w, v * h, 2.2, 0, TAU); x.fill(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }

  // Wear as a roughness map: scuffed patches and a few hairline scratches break up the mirror finish of the metal
  function wearTex() {
    const w = 512, h = 256, cv = canvas(w, h), x = cv.getContext('2d'), rnd = rng(31);
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const cx = rnd() * w, cy = rnd() * h, r = 8 + rnd() * 34, v = rnd() < 0.5 ? 40 : 230, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${v},${v},${v},0.35)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const sx = rnd() * w, sy = rnd() * h, a = rnd() * TAU, l = 10 + rnd() * 40; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }

  // Soot and heat stains on the underside, as a colour map: white is untouched hull, the stains darken it.
  // The underside is the bottom of the lathe UVs, which sit at the bottom of the canvas
  function scorchTex() {
    const w = 512, h = 256, cv = canvas(w, h), x = cv.getContext('2d'), rnd = rng(91);
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) {
      const cx = rnd() * w, cy = h * (0.84 + rnd() * 0.16), r = 10 + rnd() * 44, v = 150 + Math.floor(rnd() * 50);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${v},${v - 10},${v - 20},.85)`); g.addColorStop(1, `rgba(${v},${v - 10},${v - 20},0)`);
      x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // The ion wash: fixed points that each travel from the belly back along the heading, fading as they go
  function wash(glowTex) {
    const pos = new Float32Array(WASH * 3), col = new Float32Array(WASH * 3), life = new Float32Array(WASH);
    for (let i = 0; i < WASH; i++) life[i] = i / WASH;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, map: glowTex, sizeAttenuation: true, vertexColors: true,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false;
    return { pts, pos, col, life };
  }

  // Builds the saucer group. env is the room reflection; glowTex a soft radial sprite texture
  function build(T, env, glowTex) {
    THREE = T; CORE = new THREE.Color(0x8ff0ff); HOT = new THREE.Color(0xffffff);
    const g = new THREE.Group();
    // lathe profile, bottom centre to top centre (outward normals): a lenticular disc with a tapered underside
    const prof = [[0, -0.15], [0.25, -0.14], [0.55, -0.11], [0.82, -0.065], [0.96, -0.022], [1, 0], [0.96, 0.03], [0.84, 0.068], [0.6, 0.12], [0.3, 0.16], [0, 0.17]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const hullGeo = new THREE.LatheGeometry(prof, 128);
    // the underside sits in its own shadow: vertex colours darken toward the bottom, a little cooler
    const pos = hullGeo.attributes.position, shade = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const k = Math.max(0.36, Math.min(1, 0.5 + pos.getY(i) * 2.8)); shade.set([k * 0.97, k * 0.99, k * 1.04], i * 3); }
    hullGeo.setAttribute('color', new THREE.BufferAttribute(shade, 3));
    const seamMat = new THREE.MeshPhysicalMaterial({ color: 0x27303c, metalness: 1, roughness: 0.5, envMap: env });
    const hullMat = new THREE.MeshPhysicalMaterial({ color: 0xc9d4e0, vertexColors: true, map: scorchTex(), metalness: 1, roughness: 0.4, roughnessMap: wearTex(), clearcoat: 1, clearcoatRoughness: 0.06,
      envMap: env, envMapIntensity: 1.2, bumpMap: panelTex(), bumpScale: 0.6, iridescence: 0.45, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 420] });
    g.add(new THREE.Mesh(hullGeo, hullMat));
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.006, 8, 160), seamMat); seam.rotation.x = Math.PI / 2; seam.position.y = 0.118; g.add(seam);
    // a chrome lip where the disc turns over: the highlight that makes the edge read as machined
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1, 0.009, 10, 200), new THREE.MeshPhysicalMaterial({ color: 0xeef8ff, metalness: 1, roughness: 0.12, envMap: env, envMapIntensity: 2 }));
    lip.rotation.x = Math.PI / 2; g.add(lip);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.985, 0.014, 10, 200), new THREE.MeshBasicMaterial({ color: 0x8ff0ff })); rim.rotation.x = Math.PI / 2; g.add(rim);
    // a ring on the belly between the vents and the core
    const belly = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.01, 8, 160), seamMat); belly.rotation.x = Math.PI / 2; belly.position.y = -0.09; g.add(belly);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 24, 0, TAU, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({
      color: 0x9fe8ff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.42, envMap: env, envMapIntensity: 1.8,
      emissive: 0x0d4a66, emissiveIntensity: 0.7, clearcoat: 1 }));
    dome.scale.y = 0.42; dome.position.y = 0.15; g.add(dome);
    // the canopy frame: a dark metal ring where the glass meets the hull
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.012, 10, 96), seamMat); frame.rotation.x = Math.PI / 2; frame.position.y = 0.15; g.add(frame);
    // the cabin behind the glass: a dark, faintly lit pocket that gives the dome depth
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 16, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0b3a4d, transparent: true, opacity: 0.5, depthWrite: false }));
    cabin.scale.y = 0.4; cabin.position.y = 0.14; g.add(cabin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.14, 12), seamMat); mast.position.y = 0.365; g.add(mast);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9fe8ff })); tip.position.y = 0.44; g.add(tip);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.05, 40), new THREE.MeshBasicMaterial({ color: CORE })); core.position.y = -0.14; g.add(core);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    halo.rotation.x = Math.PI / 2; halo.position.y = -0.2; g.add(halo);
    // the belly: a ring of 36 radial vents (one instanced mesh), so the underside reads as machinery
    const vents = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.012, 0.028), new THREE.MeshBasicMaterial({ color: 0x0a1218 }), 36);
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), p3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; p3.set(Math.cos(a) * 0.7, -0.088, Math.sin(a) * 0.7); q4.setFromEuler(e4.set(0, -a, 0)); vents.setMatrixAt(i, m4.compose(p3, q4, one)); }
    vents.instanceMatrix.needsUpdate = true; g.add(vents);
    const lights = [], lm = new THREE.MeshBasicMaterial({ color: 0xbff8ff });
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), lm); m.position.set(Math.cos(a) * 1.02, 0, Math.sin(a) * 1.02); g.add(m); lights.push(m); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7fe9ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(3.4); g.add(glow);
    const w = wash(glowTex); g.add(w.pts);
    g.userData = { lights, halo, glow, core, wash: w, level: 0 };
    g.scale.setScalar(0.9);
    return g;
  }

  // Each frame: the running lights breathe, the core and glow warm with thrust, and the ion wash streams back from the
  // belly. level is 0 at rest and 1 at cruising speed (more when boosting). calm keeps the motion gentle.
  function animate(ship, dt, t, level, calm) {
    const u = ship.userData, amp = calm ? 0.2 : 1, W = u.wash, n = W.life.length;
    u.level += (clamp(level, 0, 1.5) - u.level) * Math.min(1, dt * 4);
    const L = clamp(u.level, 0, 1);
    u.lights.forEach((m, i) => m.scale.setScalar(0.75 + 0.5 * amp * (0.5 + 0.5 * Math.sin(t * 5 - i * 0.55))));
    u.glow.material.opacity = 0.28 + 0.1 * amp * Math.sin(t * 3) + 0.12 * L;
    u.halo.material.opacity = 0.3 + 0.1 * amp * Math.sin(t * 4) + 0.1 * L;
    u.core.material.color.copy(CORE).lerp(HOT, 0.6 * L);
    for (let i = 0; i < n; i++) {
      let k = W.life[i] + dt * (0.45 + 0.9 * L) * (1 + (i % 3) * 0.2);
      if (k >= 1) k -= 1;
      W.life[i] = k;
      const a = i * GOLDEN, r = (0.06 + 0.14 * (((i * 7) % 5) / 5)) * (0.5 + k), flick = 0.85 + 0.15 * amp * Math.sin(t * 17 + i * 1.7);
      const b = (1 - k) * (1 - k) * L * flick, j = i * 3;
      W.pos[j] = Math.cos(a) * r; W.pos[j + 1] = -0.12 - 0.12 * k; W.pos[j + 2] = 0.22 + k * (0.7 + 1.6 * L);
      W.col[j] = 0.55 * b; W.col[j + 1] = 0.95 * b; W.col[j + 2] = b;
    }
    W.pts.geometry.attributes.position.needsUpdate = true; W.pts.geometry.attributes.color.needsUpdate = true;
  }

  return { build, animate };
})();
