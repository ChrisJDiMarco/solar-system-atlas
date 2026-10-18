// UFO mode for the Solar System Atlas: a third-person saucer you fly through the live system.
// Its scanner locks the planet, dwarf planet, moon or Sun in its beam; Scan reads that body into the info card.
// Go to glides to a body; Orbit (T) circles it at a safe distance. Where you park is saved, and Fly UFO resumes there.
// index.html's Atlas module calls init(), update() and the gain/active/rows hooks. The saucer model lives in js/ship.js.
window.App = window.App || {};
App.ufo = (function () {
  const TAU = Math.PI * 2, D2R = Math.PI / 180, LOCK_CONE = Math.cos(16 * D2R), LOCK_RANGE = 400, SCAN_TIME = 1.4, ORBIT_SPEED = 3;
  // Exaggerated visible size, UFO mode only (planets, moons and dwarfs read as large, big-picture bodies)
  const GAIN = { planet: 5, dwarf: 4, moon: 6, star: 2 };
  const KEYS = { w: 'fwd', arrowup: 'fwd', s: 'back', arrowdown: 'back', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
    e: 'up', q: 'down', i: 'noseUp', k: 'noseDown', shift: 'boost', f: 'scan', g: 'goto', t: 'orbit', escape: 'exit' };
  // Keys that fly the craft by hand: pressing one takes the controls back from the autopilot
  const FLIGHT = new Set(['fwd', 'back', 'left', 'right', 'up', 'down', 'noseUp', 'noseDown']);
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const setText = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  let THREE = null, C = null, on = false, calm = false, env = null, glowTex = null, ship = null, sunLight = null, beam = null, ring = null, reticle = null, hud = {};
  // The bodies the craft can lock, collide with and fly to: rebuilt only when the body list changes
  let cands = [], candN = -1;
  // Scratch objects, reused every frame so the loop allocates nothing
  let tmpA, tmpB, tmpD, tmpF, tmpW, tmpQ, tmpQ2, tmpE, tmpO;
  // Speed readout: the craft's heliocentric speed over real time, from the last HUD tick
  let prevAU = null, prevT = 0, kms = 0;
  const st = { pos: null, vel: null, yaw: 0, pitch: 0, roll: 0, camYaw: 0, camPitch: 0.3, camDist: 8, drag: null, keys: {},
    lock: null, scan: null, auto: null, orbit: null, lastScan: null, saved: null, hudT: 0 };

  // Visible-size multiplier used by the Atlas (1 when UFO mode is off, or in true-size mode)
  function gain(kind) { return (on && C.S.scale.size !== 'true' && GAIN[kind]) || 1; }
  function active() { return on; }

  // Lines in UFO mode: only the planets' orbits stay, dimmed; every other orbit and ring waits until the craft lands
  function lineOn(tag) { return !on || tag === 'planet'; }
  function dimLine(l) {
    if (l.userData.op == null) l.userData.op = l.material.opacity;
    l.material.opacity = on ? l.userData.op * 0.45 : l.userData.op;
  }

  function candidates() {
    if (candN !== C.list.length) { cands = C.list.filter((b) => GAIN[b.kind]); candN = C.list.length; }
    return cands;
  }

  // The craft's heliocentric position in AU, inverted from the Atlas's mapping (linear or log distance)
  function shipAU() {
    const v = st.pos, L = v.length();
    if (!v || L < 1e-9) return [0, 0, 0];
    const r = C.S.scale.dist === 'log' ? 0.05 * (Math.pow(10, L / 60) - 1) : L / 100, k = r / L;
    return [v.x * k, -v.z * k, v.y * k];
  }

  // The inverse of shipAU: a heliocentric AU position as a scene point, on the Atlas's current mapping
  function auToScene(au) {
    const r = Math.hypot(au[0], au[1], au[2]);
    const L = C.S.scale.dist === 'log' ? 60 * Math.log10(1 + r / 0.05) : r * 100, k = r > 1e-14 ? L / r : 0;
    return new THREE.Vector3(au[0] * k, au[2] * k, -au[1] * k);
  }

  // Extra rows for the info card while a body is the last scan
  function rows(b) {
    if (!on || !st.pos || b.name !== st.lastScan) return [];
    const a = shipAU(), d = Math.hypot(b.h[0] - a[0], b.h[1] - a[1], b.h[2] - a[2]);
    return [['Scanned from the UFO', d < 0.01 ? Math.round(d * C.AU_KM).toLocaleString() + ' km away' : d.toFixed(3) + ' AU away']];
  }

  function setBtn() {
    if (!hud.btn) return;
    hud.btn.textContent = on ? 'Exit UFO' : 'Fly UFO';
    hud.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // Saves where the craft is parked (heliocentric AU) so Fly UFO picks up there. now: write straight away (page closing)
  function park(now) {
    if (!st.pos || !C.App.actions.setUfo) return;
    try { C.App.actions.setUfo(shipAU(), now); } catch (e) { console.warn('UFO: could not park', e); }
  }

  function enter() {
    if (on || !C || !C.bodies.Earth || !C.App.actions) return;
    const S = C.S, saved = C.App.state.ufo;
    st.saved = { size: S.scale.size, dist: S.scale.dist };
    C.App.actions.setScale('size', 'visible'); C.App.actions.setScale('dist', 'log');
    // resume where the craft was parked; otherwise start beside Earth
    const home = !!(saved && Array.isArray(saved.au));
    const start = home ? auToScene(saved.au) : C.bodies.Earth.sp.clone().add(new THREE.Vector3(0, 6, 9));
    const f = start.clone().negate().normalize();     // face the Sun
    st.pos = start; st.vel = new THREE.Vector3(); st.yaw = Math.atan2(-f.x, -f.z); st.pitch = 0; st.roll = 0;
    st.camYaw = 0; st.camPitch = 0.3; st.camDist = 8; st.keys = {}; st.lock = null; st.scan = null; st.auto = null; st.orbit = null; st.lastScan = null;
    prevAU = null; kms = 0;
    on = true; document.body.classList.add('ufoOn'); C.controls.enabled = false; ship.visible = true; sunLight.visible = true;
    hud.root.hidden = false; reticle.hidden = false; setBtn();
    const r = Math.hypot(...shipAU());
    C.hint(home ? 'Back in the UFO · parked ' + r.toFixed(2) + ' AU out · Esc exits' : 'UFO mode · WASD fly · E/Q up and down · F scan · G go to · T orbit · Esc exits');
  }

  function exit() {
    if (!on) return;
    park(false);                                     // before the scale is restored: the position is read on the flight mapping
    on = false; document.body.classList.remove('ufoOn'); st.drag = null; st.keys = {}; st.scan = null; st.auto = null; st.orbit = null;
    ship.visible = false; sunLight.visible = false; beam.visible = false; ring.visible = false; reticle.hidden = true; hud.root.hidden = true;
    hud.bar.style.width = '0%';
    C.camera.clearViewOffset();
    C.controls.enabled = true;
    const s = st.saved; if (s) { C.App.actions.setScale('size', s.size); C.App.actions.setScale('dist', s.dist); }
    setBtn(); C.hint('Back to the Atlas view');
  }

  function toggle() { if (on) exit(); else enter(); }

  function scan() {
    if (!on || st.scan) return;
    if (!st.lock) { C.hint('Nothing in the beam: point the ship at a planet, moon, dwarf planet or the Sun'); return; }
    st.scan = { body: st.lock, t: 0 };
    C.hint('Scanning ' + st.lock.name + '…');
  }

  // Go to: glide to the body in the beam and hold off it. G again, or any flight key, gives the controls back
  function stopGoTo(msg) { st.auto = null; if (msg) C.hint(msg); }
  function toggleGoTo() {
    if (!on) return;
    if (st.auto) { stopGoTo('Autopilot off'); return; }
    if (!st.lock) { C.hint('Point the beam at a body, then press G to go to it'); return; }
    st.orbit = null; st.auto = st.lock; C.hint('Going to ' + st.lock.name + ' · G or a flight key takes over');
  }

  // Orbit: circle the body in the beam on a ring well outside its hold-off distance, keeping it in view. T again, or a flight key, gives the controls back
  function stopOrbit(msg) { st.orbit = null; if (msg) C.hint(msg); }
  function toggleOrbit() {
    if (!on) return;
    if (st.orbit) { stopOrbit('Orbit off'); return; }
    if (!st.lock) { C.hint('Point the beam at a body, then press T to orbit it'); return; }
    st.auto = null;
    const b = st.lock, d = tmpA.copy(st.pos).sub(b.sp);
    st.orbit = { body: b, ang: Math.atan2(d.z, d.x) };
    C.hint('Orbiting ' + b.name + ' · T or a flight key takes over');
  }

  // Autopilot: turns to face the body and eases in, slowing as it nears; it holds off just outside the body's solid radius.
  // Returns true while it flies the craft (and fills want); false once it has arrived, the body is hidden or it was stopped
  function autoPilot(dt, v, want) {
    const b = st.auto;
    if (!b.grp.visible) { stopGoTo(b.name + ' is hidden: autopilot off'); return false; }
    const d = tmpA.copy(b.sp).sub(st.pos), dl = d.length(), stand = (C.visR(b) * 1.15 + 0.3) * 1.5;
    if (dl <= stand) { stopGoTo('Holding off ' + b.name); return false; }
    d.divideScalar(dl);
    st.yaw += wrapA(Math.atan2(-d.x, -d.z) - st.yaw) * Math.min(1, dt * 2.2);
    st.pitch += (clamp(Math.asin(clamp(d.y, -1, 1)), -1.3, 1.3) - st.pitch) * Math.min(1, dt * 2.2);
    want.copy(d).multiplyScalar(Math.min(v, 1 + (dl - stand) * 0.5));
    return true;
  }

  // Orbit flies the craft round the body on a ring (lifted a quarter of its radius, so the body reads from above),
  // with the velocity of the ring added to the pull back onto it. It turns to keep the body in the beam.
  function orbitPilot(dt, v, want) {
    const o = st.orbit, b = o.body;
    if (!b.grp.visible) { stopOrbit(b.name + ' is hidden: orbit off'); return false; }
    const R = (C.visR(b) * 1.15 + 0.3) * 2.2, w = clamp(ORBIT_SPEED / R, 0.02, 0.8);
    o.ang += w * dt;
    const p = tmpO.set(b.sp.x + Math.cos(o.ang) * R, b.sp.y + R * 0.25, b.sp.z + Math.sin(o.ang) * R);
    const d = tmpD.copy(p).sub(st.pos);
    const toB = tmpB.copy(b.sp).sub(st.pos).normalize();
    st.yaw += wrapA(Math.atan2(-toB.x, -toB.z) - st.yaw) * Math.min(1, dt * 2.2);
    st.pitch += (clamp(Math.asin(clamp(toB.y, -1, 1)), -1.3, 1.3) - st.pitch) * Math.min(1, dt * 2.2);
    want.set(-Math.sin(o.ang), 0, Math.cos(o.ang)).multiplyScalar(ORBIT_SPEED).addScaledVector(d, 1.5);
    if (want.length() > v) want.setLength(v);
    return true;
  }

  function cancelScan(msg) {
    st.scan = null; beam.visible = false; ring.visible = false; hud.bar.style.width = '0%';
    C.hint(msg);
  }

  // The scan is done: the info card opens with the full readout, and the body joins the scan log (saved in memory)
  function finishScan(b) {
    st.scan = null; beam.visible = false; ring.visible = false; st.lastScan = b.name; hud.bar.style.width = '0%';
    if (C.App.actions.addScan) C.App.actions.addScan(b.name);
    C.App.ui.select(b);
    C.hint('Scan complete: ' + b.name);
  }

  function hudTick() {
    const L = st.lock, a = shipAU(), r = Math.hypot(a[0], a[1], a[2]), now = performance.now();
    if (prevAU && now > prevT) kms = Math.hypot(a[0] - prevAU[0], a[1] - prevAU[1], a[2] - prevAU[2]) * C.AU_KM / ((now - prevT) / 1000);
    prevAU = a; prevT = now;
    setText(hud.lock, st.scan ? 'Scanning ' + st.scan.body.name + '…' : L ? L.name : 'Nothing in the beam');
    hud.lock.classList.toggle('on', !!L || !!st.scan);
    setText(hud.ship, r.toFixed(r < 10 ? 2 : 1) + ' AU from the Sun');
    setText(hud.speed, kms < 1 ? 'Holding still' : Math.round(kms).toLocaleString() + ' km/s');
    // the buttons say what they will do now: Scan is dimmed while nothing is in the beam, Go to and Orbit show Stop while they fly
    hud.scan.setAttribute('aria-disabled', L || st.scan ? 'false' : 'true');
    setText(hud.goto, st.auto ? 'Stop' : 'Go to · G');
    hud.goto.setAttribute('aria-pressed', st.auto ? 'true' : 'false');
    setText(hud.orbit, st.orbit ? 'Stop orbit' : 'Orbit · T');
    hud.orbit.setAttribute('aria-pressed', st.orbit ? 'true' : 'false');
    const scans = Array.isArray(C.App.state.scans) ? C.App.state.scans.slice(0, 4) : [];
    setText(hud.last, st.lastScan || scans[0] || 'none yet');
    const key = scans.join('|');
    if (key !== hud.scanKey) { // rebuild the scan log only when it changed
      hud.scanKey = key; hud.scans.textContent = '';
      if (!scans.length) { const e = document.createElement('span'); e.className = 'uh-none'; e.textContent = 'Scan a body to log it here'; hud.scans.appendChild(e); }
      scans.forEach((n) => {
        const b = document.createElement('button'); b.textContent = n; b.title = 'Show ' + n + ' in the info card';
        b.onclick = () => { if (C.bodies[n]) C.App.ui.select(C.bodies[n]); };
        hud.scans.appendChild(b);
      });
    }
  }

  // Called from the Atlas frame loop, before the floating origin is applied: F becomes the craft's position
  function update(dt, F) {
    const k = st.keys, cam = C.camera, list = candidates(), t = performance.now() / 1000;
    // speed grows with distance from the Sun so the whole system is reachable; the velocity has inertia
    const base = 6 + st.pos.length() * 0.12, v = base * (k.boost ? 3 : 1), want = tmpW.set(0, 0, 0);
    // while an autopilot flies (Go to or Orbit), it sets the heading and the wanted velocity itself; keys take over once pressed
    const auto = st.auto ? autoPilot(dt, v, want) : false;
    const orb = !auto && st.orbit ? orbitPilot(dt, v, want) : false;
    const piloted = auto || orb;
    const turn = piloted ? 0 : (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (!piloted) {
      st.yaw -= turn * 1.9 * dt;                                  // right is -yaw: the craft faces -Z
      st.pitch = clamp(st.pitch + ((k.noseUp ? 1 : 0) - (k.noseDown ? 1 : 0)) * 1.1 * dt, -1.3, 1.3);
    }
    st.roll += (-turn * 0.4 - st.roll) * Math.min(1, dt * 4);
    const q = tmpQ.setFromEuler(tmpE.set(st.pitch, st.yaw, st.roll, 'YXZ'));
    const fwd = tmpF.set(0, 0, -1).applyQuaternion(q);
    if (!piloted) {
      const thr = (k.fwd ? 1 : 0) - (k.back ? 1 : 0), lift = (k.up ? 1 : 0) - (k.down ? 1 : 0);
      want.copy(fwd).multiplyScalar(thr * v); want.y += lift * v * 0.6;
    }
    st.vel.lerp(want, Math.min(1, dt * 2.5));
    st.pos.addScaledVector(st.vel, dt);
    // solid bodies: the craft cannot pass through a planet, moon, dwarf or the Sun
    for (const b of list) {
      if (!b.grp.visible) continue;
      const d = tmpA.copy(st.pos).sub(b.sp), dl = d.length(), R = C.visR(b) * 1.15 + 0.3;
      if (dl < R) { if (dl < 1e-9) d.set(0, 1, 0); st.pos.copy(b.sp).addScaledVector(d.normalize(), R); st.vel.multiplyScalar(0.2); }
    }
    // scanner: the body nearest the beam axis inside a 16° cone, within range
    let best = null, bd = LOCK_CONE;
    for (const b of list) {
      if (!b.grp.visible) continue;
      const d = tmpA.copy(b.sp).sub(st.pos), dl = d.length();
      if (dl < 1e-9 || dl > LOCK_RANGE) continue;
      const c = fwd.dot(d) / dl;
      if (c > bd) { bd = c; best = b; }
    }
    st.lock = best;
    // camera: chases the craft from behind; a drag swings it around, then it eases back
    st.camYaw += (st.drag ? 0 : -st.camYaw) * Math.min(1, dt * 1.5);
    const cp = Math.cos(st.camPitch), off = tmpB.set(Math.sin(st.camYaw) * cp, Math.sin(st.camPitch), Math.cos(st.camYaw) * cp).multiplyScalar(st.camDist);
    off.applyQuaternion(tmpQ2.setFromEuler(tmpE.set(0, st.yaw, 0)));
    F.copy(st.pos);
    ship.position.set(0, 0, 0); ship.quaternion.copy(q);
    cam.position.copy(off); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
    // the craft sits a fifth of the way in from the right, so the HUD and the info card never cover it
    cam.setViewOffset(innerWidth, innerHeight, -innerWidth * 0.2, 0, innerWidth, innerHeight);
    sunLight.position.copy(C.sun.sp).sub(F);
    // the saucer breathes, and its ion wash streams at the speed it actually makes
    App.ship.animate(ship, dt, t, st.vel.length() / base, calm);
    // a body that gets hidden mid-scan (its layer switched off) cancels the scan rather than reading nothing
    if (st.scan && !st.scan.body.grp.visible) cancelScan('Scan cancelled: that body is hidden');
    // the scan beam and its expanding ring, on the body being read
    if (st.scan) {
      st.scan.t += dt;
      const p = Math.min(1, st.scan.t / SCAN_TIME), b = st.scan.body, tp = tmpD.copy(b.sp).sub(F);
      const bp = beam.geometry.attributes.position; bp.setXYZ(0, 0, 0, 0); bp.setXYZ(1, tp.x, tp.y, tp.z); bp.needsUpdate = true;
      beam.material.opacity = 0.9 * (1 - p * 0.5); beam.visible = true;
      ring.visible = true; ring.position.copy(tp); ring.quaternion.copy(cam.quaternion);
      ring.scale.setScalar(C.visR(b) * (1.2 + p * 2.6)); ring.material.opacity = 1 - p;
      hud.bar.style.width = (p * 100).toFixed(1) + '%';
      if (p >= 1) finishScan(b);
    }
    // reticle: where the beam points, in screen space
    const rp = tmpD.copy(fwd).multiplyScalar(40).project(cam);
    if (rp.z < 1) { const sx = (rp.x * 0.5 + 0.5) * innerWidth, sy = (-rp.y * 0.5 + 0.5) * innerHeight; reticle.style.transform = `translate(${sx - 14}px,${sy - 14}px)`; }
    reticle.classList.toggle('on', !!best);
    st.hudT -= dt; if (st.hudT <= 0) { st.hudT = 0.2; hudTick(); }
  }

  // Keys belong to the craft while it flies; the Atlas's own shortcuts wait until it lands
  addEventListener('keydown', (e) => {
    if (!on || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    const act = KEYS[String(e.key || '').toLowerCase()];
    if (!act) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (act === 'exit') exit();
    else if (act === 'scan') { if (!e.repeat) scan(); }
    else if (act === 'goto') { if (!e.repeat) toggleGoTo(); }
    else if (act === 'orbit') { if (!e.repeat) toggleOrbit(); }
    else {
      st.keys[act] = true;
      if (FLIGHT.has(act)) { if (st.auto) stopGoTo('Autopilot off: you have the controls'); if (st.orbit) stopOrbit('Orbit off: you have the controls'); }
    }
  }, true);
  addEventListener('keyup', (e) => { const act = KEYS[String(e.key || '').toLowerCase()]; if (act) st.keys[act] = false; }, true);
  addEventListener('blur', () => { st.keys = {}; st.drag = null; });
  // closing the page while flying parks the craft, so the next visit resumes there
  addEventListener('pagehide', () => { if (on) park(true); });

  function bindCanvas(cv) {
    cv.addEventListener('pointerdown', (e) => { if (!on) return; st.drag = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
    cv.addEventListener('pointermove', (e) => {
      if (!on || !st.drag) return;
      const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y; st.drag.x = e.clientX; st.drag.y = e.clientY;
      st.camYaw -= dx * 0.008; st.camPitch = clamp(st.camPitch + dy * 0.006, -0.25, 1.3);
    });
    const end = () => { st.drag = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => { if (!on) return; e.preventDefault(); st.camDist = clamp(st.camDist * Math.exp(e.deltaY * 0.0015), 3, 80); }, { passive: false });
  }

  // Called once by the Atlas module, after its scene is built
  function init(c) {
    C = c; THREE = c.THREE;
    calm = !!(window.cabinet && cabinet.reducedMotion === true) || (!!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    tmpA = new THREE.Vector3(); tmpB = new THREE.Vector3(); tmpD = new THREE.Vector3(); tmpF = new THREE.Vector3(); tmpW = new THREE.Vector3(); tmpO = new THREE.Vector3();
    tmpQ = new THREE.Quaternion(); tmpQ2 = new THREE.Quaternion(); tmpE = new THREE.Euler();
    st.vel = new THREE.Vector3();
    if (c.RoomEnvironment) { const pm = new THREE.PMREMGenerator(c.renderer); env = pm.fromScene(new c.RoomEnvironment(), 0.04).texture; pm.dispose(); }
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(cv);
    ship = App.ship.build(THREE, env, glowTex); ship.visible = false; c.scene.add(ship);
    // a faint cool fill under the saucer, so its shaded underside keeps some detail (lives on the ship, so it goes with it)
    const shipFill = new THREE.PointLight(0x9fe8ff, 0.35, 0, 0); shipFill.position.set(0, -0.7, 0); ship.add(shipFill);
    // the Sun's light on the craft only: it is off (and skipped by the renderer) until the craft flies
    sunLight = new THREE.PointLight(0xfff1dc, 2, 0, 0); sunLight.visible = false; c.scene.add(sunLight);
    beam = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)),
      new THREE.LineBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0.9, depthWrite: false }));
    beam.frustumCulled = false; beam.visible = false; c.scene.add(beam);
    ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    ring.visible = false; c.scene.add(ring);
    const $ = (id) => document.getElementById(id);
    hud = { root: $('ufoHud'), lock: $('uhLock'), ship: $('uhShip'), speed: $('uhSpeed'), last: $('uhLast'), bar: $('uhBar'), scans: $('uhScans'), btn: $('btnUfo'), scan: $('uhScan'), goto: $('uhGoto'), orbit: $('uhOrbit') };
    reticle = $('ufoRet');
    $('btnUfo').onclick = toggle; $('uhScan').onclick = scan; $('uhGoto').onclick = toggleGoTo; $('uhOrbit').onclick = toggleOrbit; $('uhExit').onclick = exit;
    bindCanvas(c.canvas);
  }

  return { init, update, gain, active, lineOn, dimLine, rows, shipAU, toggle, goTo: toggleGoTo, orbit: toggleOrbit };
})();
