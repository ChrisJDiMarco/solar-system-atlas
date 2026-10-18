window.App = window.App || {};
(function () {
  const LAYERS = { orbits: true, labels: true, moons: true, belts: true, kuiper: true, oort: true, helio: true, p9: true, craft: true, comets: true, stars: true, milky: true };
  const def = () => ({ v: 1, time: { live: true, jd: null, rate: 1, paused: false }, camera: { focus: 'Sun', dist: null, az: 0.6, el: 0.35 },
    layers: { ...LAYERS }, moonFilter: {}, scale: { size: 'visible', dist: 'log' }, p9: 'brief', tab: 'layers', card: true, recent: [] });
  function load() {
    const s = def();
    let m = null; try { m = window.cabinet && cabinet.recall ? cabinet.recall('atlas', null) : null; } catch (e) {}
    if (!m || typeof m !== 'object') return s;
    const t = m.time || {};
    s.time.live = t.live !== false;
    if (Number.isFinite(t.jd) && t.jd >= 2086302.5 && t.jd <= 2817152.5) s.time.jd = t.jd;
    if (Number.isFinite(t.rate) && Math.abs(t.rate) <= 3.2e7) s.time.rate = t.rate;
    s.time.paused = !!t.paused;
    const c = m.camera || {};
    if (typeof c.focus === 'string' && c.focus.length < 40) s.camera.focus = c.focus;
    ['dist', 'az', 'el'].forEach(k => { if (Number.isFinite(c[k])) s.camera[k] = c[k]; });
    if (s.camera.dist != null && !(s.camera.dist > 1e-6 && s.camera.dist < 2e8)) s.camera.dist = null;
    if (m.layers) for (const k in LAYERS) if (typeof m.layers[k] === 'boolean') s.layers[k] = m.layers[k];
    if (m.moonFilter && typeof m.moonFilter === 'object') for (const k in m.moonFilter) s.moonFilter[k] = !!m.moonFilter[k];
    if (m.scale) { if (m.scale.size === 'true' || m.scale.size === 'visible') s.scale.size = m.scale.size; if (m.scale.dist === 'log' || m.scale.dist === 'linear') s.scale.dist = m.scale.dist; }
    if (m.p9 === 'bb2021' || m.p9 === 'brief') s.p9 = m.p9;
    if (['layers', 'tonight', 'moons', 'about'].includes(m.tab)) s.tab = m.tab;
    if (typeof m.card === 'boolean') s.card = m.card;
    s.cardMini = m.cardMini === true;
    if (Array.isArray(m.recent)) s.recent = m.recent.filter(x => typeof x === 'string' && x.length < 40).slice(0, 6);
    return s;
  }
  App.state = load();
  App.sim = { jd: App.state.time.live || !App.state.time.jd ? App.E.jdNow() : App.state.time.jd };
  const subs = [];
  App.on = (fn) => subs.push(fn);
  const emit = (what) => subs.forEach(f => { try { f(what); } catch (e) { console.warn(e); } });
  let saveT = 0;
  App.save = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { App.state.time.jd = App.sim.jd; cabinet.remember('atlas', App.state); } catch (e) {} }, 600);
  };
  const MIN_JD = 2086302.5, MAX_JD = 2817152.5; // 1000–3000 AD
  const S = App.state;
  App.actions = {
    setRate(r) { r = Number(r); if (!Number.isFinite(r)) throw new Error('That speed could not be read.'); S.time.rate = Math.max(-3.15576e7, Math.min(3.15576e7, r)); S.time.live = false; S.time.paused = false; App.save(); emit('time'); },
    reverse() { S.time.rate = -S.time.rate; S.time.live = false; App.save(); emit('time'); },
    togglePause() { S.time.paused = !S.time.paused; if (S.time.paused) S.time.live = false; App.save(); emit('time'); },
    realtime() { S.time.rate = 1; S.time.paused = false; S.time.live = false; App.save(); emit('time'); },
    now() { S.time.live = true; S.time.rate = 1; S.time.paused = false; App.sim.jd = App.E.jdNow(); App.save(); emit('time'); },
    jumpTo(date) {
      const d = date instanceof Date ? date : new Date(String(date).length <= 10 ? date + 'T12:00:00Z' : date);
      if (isNaN(d)) throw new Error('That date could not be read.');
      App.sim.jd = Math.max(MIN_JD, Math.min(MAX_JD, App.E.dateToJd(d))); S.time.live = false; App.save(); emit('time');
      return App.sim.jd;
    },
    focus(name) { if (App.bodies && !App.bodies[name]) throw new Error('No body named ' + name + ' in the Atlas.'); S.camera.focus = name; if (name !== 'Sun') S.recent = [name, ...S.recent.filter(x => x !== name)].slice(0, 6); App.save(); emit('focus'); },
    toggleLayer(k, v) { if (!(k in S.layers)) throw new Error('No layer ' + k); S.layers[k] = typeof v === 'boolean' ? v : !S.layers[k]; App.save(); emit('layers'); return S.layers[k]; },
    toggleMoons(parent) { S.moonFilter[parent] = S.moonFilter[parent] === false; App.save(); emit('layers'); },
    setScale(k, v) { S.scale[k] = v; App.save(); emit('scale'); },
    setP9(v) { S.p9 = v; App.save(); emit('scale'); },
    setCard(v) { S.card = !!v; App.save(); },
    setCardMini(v) { S.cardMini = !!v; App.save(); },
    setTab(t) { S.tab = t; App.save(); emit('tab'); },
    saveCamera(d, az, el) { S.camera.dist = d; S.camera.az = az; S.camera.el = el; App.save(); }
  };
  App.clampInfo = () => { const y = App.E.jdToDate(App.sim.jd).getUTCFullYear(); return y < 1800 || y > 2050 ? 'Outside 1800–2050: planet positions degrade (Standish)' : ''; };
})();
