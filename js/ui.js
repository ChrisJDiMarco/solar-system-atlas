window.App = window.App || {};
App.ui = (function () {
  const $ = (id) => document.getElementById(id), S = App.state, E = App.E, D = App.D;
  let ctx = null, sel = null;
  const LAYERS = [['orbits', 'Orbits'], ['labels', 'Labels'], ['moons', 'Moons'], ['belts', 'Asteroid belts · Trojans · Hildas'], ['kuiper', 'Kuiper belt · TNOs'], ['oort', 'Oort cloud'],
    ['helio', 'Heliosphere'], ['p9', 'Planet Nine (hypothetical)'], ['craft', 'Spacecraft'], ['comets', 'Comets'], ['stars', 'Stars'], ['milky', 'Milky Way']];
  const MAXR = 3.15576e7, LMAX = Math.log10(MAXR);
  const fmtRate = (r) => { const a = Math.abs(r), s = r < 0 ? '−' : '';
    const u = [[3.15576e7, 'yr'], [2629800, 'mo'], [86400, 'day'], [3600, 'h'], [60, 'min'], [1, 's']].find(x => a >= x[0] * .999) || [1, 's'];
    const n = a / u[0]; return s + (n >= 10 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, '')) + ' ' + u[1] + '/s'; };
  const sci = (m) => { if (!m) return '—'; const e = Math.floor(Math.log10(m)); return (m / 10 ** e).toFixed(2) + '×10' + String(e).replace(/./g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻') + ' kg'; };
  const au = (x) => x < 0.01 ? Math.round(x * E.AU_KM).toLocaleString() + ' km' : x < 1000 ? x.toFixed(x < 10 ? 3 : 1) + ' AU' : Math.round(x).toLocaleString() + ' AU';
  function period(b) {
    if (b.kind === 'moon') return Math.abs(b.P).toFixed(Math.abs(b.P) < 10 ? 3 : 1) + ' days' + (b.P < 0 ? ' · retrograde' : '');
    let a = b.a; if (b.el) a = b.el[0]; if (b.standish) a = D.standish.Pluto[0];
    if (b.kind === 'hyp') a = D.p9[S.p9].a;
    if (!a || b.hyper) return b.hyper ? 'Unbound (hyperbolic)' : '—';
    const y = Math.pow(a, 1.5); return y < 2 ? (y * 365.25).toFixed(1) + ' days' : y.toFixed(y < 100 ? 2 : 0) + ' years';
  }
  // orbital state now: speed (vis-viva) and next perihelion
  function orbitNow(b) {
    const K2 = 0.01720209895 ** 2, jd = App.sim.jd; let a = null, n = null, M = null;
    if (b.el || b.standish) { const k = E.standishEl(b.el || D.standish.Pluto, jd); a = k.a; n = 0.01720209895 / Math.pow(a, 1.5); M = k.M; }
    else if ((b.kind === 'dwarf' || b.kind === 'etno' || b.kind === 'comet') && b.tp) { E.smallEl(b); if (b.e < 1) { a = b.a; n = 0.01720209895 / Math.pow(a, 1.5); M = n * (jd - b._tp); } else a = -b.q / (b.e - 1); }
    if (a == null) return null;
    const r = Math.hypot(...b.h), v = Math.sqrt(Math.max(0, K2 * (2 / r - 1 / a))) * 1731.457;
    let peri = null; if (n) { const m = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); peri = E.jdToDate(jd + (2 * Math.PI - m) / n); }
    return { v, peri };
  }
  function info(b) {
    const earth = ctx.bodies.Earth, r = Math.hypot(...b.h), re = Math.hypot(b.h[0] - earth.h[0], b.h[1] - earth.h[1], b.h[2] - earth.h[2]);
    return { name: b.name, kind: b.kind, rSunAU: r, rEarthAU: re, lightFromEarth: E.lightTime(re), lightFromSun: E.lightTime(r) };
  }
  function card() {
    const b = sel, c = $('card'); if (!b || b.name === 'Sun' && false) { c.hidden = true; return; }
    const i = info(b), est = b.est || b.kind === 'hyp' || b.kind === 'craft' || (b.kind === 'moon' && b.name !== 'Moon' && !b.gal) ? '<span class="est">' + (b.kind === 'hyp' ? 'HYPOTHETICAL' : b.kind === 'moon' ? 'phase illustrative' : 'estimate') + '</span>' : '';
    const kindName = { star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', etno: 'Extreme TNO', comet: b.hyper ? 'Interstellar object' : 'Comet', moon: 'Moon of ' + b.parent, craft: 'Spacecraft', hyp: 'Hypothetical planet', minor: 'Asteroid / Centaur', probe: 'Spacecraft', lagrange: 'Lagrange point' }[b.kind] || '';
    const rows = [];
    if (b.kind !== 'craft' && b.kind !== 'lagrange' && b.kind !== 'probe') rows.push(['Radius', b.kind === 'hyp' ? '~2–4 R⊕ (est.)' : b.R.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' km']);
    if (b.mass) rows.push(['Mass', sci(b.mass)]); if (b.kind === 'hyp') rows.push(['Mass', '≈' + D.p9[S.p9].mass + ' M⊕ (est.)']);
    if (b.name !== 'Sun') rows.push(['From Sun now', au(i.rSunAU)]);
    if (b.name !== 'Earth') rows.push(['From Earth now', au(i.rEarthAU)], ['Light-time from Earth', i.lightFromEarth]);
    if (b.kind !== 'craft' && b.kind !== 'star') rows.push(['Orbital period', period(b)]);
    const on = orbitNow(b); if (on) { rows.push(['Orbital speed now', on.v.toFixed(on.v < 10 ? 2 : 1) + ' km/s']); if (on.peri) { const y = on.peri.getUTCFullYear(); rows.push(['Next perihelion', y > 3000 ? 'year ' + y : on.peri.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })]); } }
    if (b.rot) rows.push(['Day (sidereal)', Math.abs(b.rot) < 48 ? Math.abs(b.rot).toFixed(2) + ' h' : (Math.abs(b.rot) / 24).toFixed(1) + ' days' + (b.rot < 0 ? ' · retro' : '')]);
    if (typeof b.obliq === 'number') rows.push(['Axial tilt', b.obliq + '°']);
    const se = season(b); if (se) rows.push(['Season now', se]);
    if (b.name === 'Saturn') { const rt = ringTilt(b); if (rt) rows.push(['Rings seen from Earth', rt]); }
    if (b.moons != null && b.kind !== 'moon' && b.kind !== 'craft' && b.kind !== 'star') rows.push(['Known moons', String(b.moons) + (b.kind === 'planet' && b.moons > 4 ? ' (' + ctx.list.filter(m => m.parent === b.name).length + ' shown)' : '')]);
    const sk = skyNow(b); if (sk) rows.splice(1, 0, ['From Earth tonight', sk]);
    if (b.disc && b.disc !== '—') rows.push(['Discovery', b.disc]); if (b.note) rows.push(['Status', b.note]);
    if (b.kind === 'hyp') rows.push(['Orbit', D.p9[S.p9].label], ['Shown at', 'aphelion: its likeliest sky region']);
    c.classList.toggle('mini', !!S.cardMini); document.body.classList.add('cardOpen');
    c.innerHTML = `<button class="min" aria-label="${S.cardMini ? 'Expand' : 'Collapse'} details" title="${S.cardMini ? 'Show details' : 'Collapse'}">${S.cardMini ? '▴' : '▾'}</button><button class="x" aria-label="Close">×</button><div class="k">${kindName}${est}</div><h3>${b.name}</h3><table>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
    c.querySelector('.x').onclick = () => { c.hidden = true; document.body.classList.remove('cardOpen'); App.actions.setCard(false); };
    c.querySelector('.min').onclick = () => { App.actions.setCardMini(!S.cardMini); card(); }; c.hidden = false;
  }
  // Subsolar latitude from the IAU pole and the live position: the season on that world
  function poleVec(b) { return b.pole ? E.radec(b.pole[0], b.pole[1]) : null; }
  function season(b) {
    if (b.kind !== 'planet' && b.name !== 'Pluto') return ''; const p = poleVec(b), r = Math.hypot(...b.h); if (!p || !r) return '';
    const s = Math.asin(Math.max(-1, Math.min(1, -(p[0] * b.h[0] + p[1] * b.h[1] + p[2] * b.h[2]) / r))) * 180 / Math.PI;
    if (Math.abs(b.obliq || 0) < 4 && b.name !== 'Pluto') return 'Sun over ' + Math.abs(s).toFixed(1) + '°' + (s >= 0 ? 'N' : 'S') + ' · barely any seasons';
    const ph = Math.abs(s) < 2 ? 'near equinox' : (s > 0 ? 'northern summer half' : 'southern summer half');
    return 'Sun over ' + Math.abs(s).toFixed(1) + '°' + (s >= 0 ? 'N' : 'S') + ' · ' + ph;
  }
  function ringTilt(b) {
    const e = ctx.bodies.Earth, p = poleVec(b); if (!e || !p) return ''; const g = [b.h[0] - e.h[0], b.h[1] - e.h[1], b.h[2] - e.h[2]], l = Math.hypot(...g);
    const B = Math.asin(Math.max(-1, Math.min(1, -(p[0] * g[0] + p[1] * g[1] + p[2] * g[2]) / l))) * 180 / Math.PI;
    return (B >= 0 ? '+' : '−') + Math.abs(B).toFixed(1) + '° ' + (Math.abs(B) < 3 ? '· nearly edge-on' : B > 0 ? '· north face' : '· south face');
  }
  // Elongation from the Sun as seen from Earth, and which sky it sits in
  function skyNow(b) {
    const e = ctx.bodies.Earth; if (!e || b === e || b.kind === 'star' || b.kind === 'moon' || b.kind === 'hyp') return '';
    const gx = b.h[0] - e.h[0], gy = b.h[1] - e.h[1], gz = b.h[2] - e.h[2], sx = -e.h[0], sy = -e.h[1];
    const gl = Math.hypot(gx, gy, gz), sl = Math.hypot(sx, sy, e.h[2]); if (!gl || !sl) return '';
    const el = Math.acos(Math.max(-1, Math.min(1, (gx * sx + gy * sy + gz * -e.h[2]) / (gl * sl)))) * 180 / Math.PI;
    let d = Math.atan2(gy, gx) - Math.atan2(sy, sx); d = Math.atan2(Math.sin(d), Math.cos(d));
    const where = el < 15 ? 'lost in Sun\u2019s glare' : el > 165 ? 'opposite Sun · all night' : d > 0 ? 'evening sky' : 'morning sky';
    return Math.round(el) + '° from Sun · ' + where;
  }
  function moonPhase() {
    const m = ctx.bodies.Moon, e = ctx.bodies.Earth; if (!m || !e) return '';
    const gx = m.h[0] - e.h[0], gy = m.h[1] - e.h[1], gz = m.h[2] - e.h[2], sx = -e.h[0], sy = -e.h[1], sz = -e.h[2];
    const c = (gx * sx + gy * sy + gz * sz) / (Math.hypot(gx, gy, gz) * Math.hypot(sx, sy, sz)); if (!isFinite(c)) return '';
    const ill = (1 - c) / 2; let d = Math.atan2(gy, gx) - Math.atan2(sy, sx); d = Math.atan2(Math.sin(d), Math.cos(d)); const wax = d > 0;
    const nm = ill < .03 ? 'New moon' : ill > .97 ? 'Full moon' : (ill < .45 ? (wax ? 'Waxing crescent' : 'Waning crescent') : ill > .55 ? (wax ? 'Waxing gibbous' : 'Waning gibbous') : (wax ? 'First quarter' : 'Last quarter'));
    return `<div class="tn" data-f="Moon" role="button" tabindex="0"><b>Moon</b><span>${nm} · ${Math.round(ill * 100)}% lit</span></div>`;
  }
  // Next oppositions: when Earth's heliocentric longitude passes the planet's (scan daily from the sim date)
  let oppCache = { key: null, html: '' };
  function oppositions() {
    const jd0 = Math.floor(App.sim.jd); if (oppCache.key === jd0) return oppCache.html;
    const lon = (el, jd) => { const v = E.planet(el, jd); return Math.atan2(v[1], v[0]); };
    const out = [];
    for (const n of ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
      const el = D.standish[n]; let prev = null;
      for (let d = 0; d <= 800; d++) {
        const jd = jd0 + d, x = lon(D.standish.Earth, jd) - lon(el, jd), s = Math.sin(x), c = Math.cos(x);
        if (prev != null && prev < 0 && s >= 0 && c > 0) { out.push({ n, jd }); break; }
        prev = s;
      }
    }
    out.sort((a, b) => a.jd - b.jd);
    oppCache = { key: jd0, html: out.length ? `<div class="k" style="color:var(--ink3);margin-top:8px">Next oppositions · best viewing</div>` + out.map(o => { const dd = Math.round(o.jd - App.sim.jd); return `<div class="tn" data-f="${o.n}" role="button" tabindex="0"><b>${o.n}</b><span>${E.jdToDate(o.jd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${dd <= 0 ? 'now' : 'in ' + dd + ' d'}</span></div>`; }).join('') : '' };
    return oppCache.html;
  }
  App.oppositions = () => { oppositions(); return oppCache.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); };
  function elong(b) { const m = /^(\d+)/.exec(skyNow(b) || ''); return m ? +m[1] : 0; }
  function tabs() {
    const body = $('tabBody'); document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
    if (S.tab === 'layers') {
      const forced = S.scale.dist === 'log';
      const rec = (S.recent || []).filter(n => ctx.bodies[n]);
      body.innerHTML = (rec.length ? `<div class="k" style="color:var(--ink3)">Recently visited</div><div class="mgrp">${rec.map(n => `<span data-f="${n}" role="button" tabindex="0">${n}</span>`).join('')}</div>` : '') + `<div class="k" style="color:var(--ink3)">Sizes</div><div class="seg"><button data-s="size:true" class="${S.scale.size === 'true' && !forced ? 'on' : ''}">True scale</button><button data-s="size:visible" class="${S.scale.size === 'visible' || forced ? 'on' : ''}">Visible</button></div>
      <div class="k" style="color:var(--ink3)">Distances</div><div class="seg"><button data-s="dist:linear" class="${S.scale.dist === 'linear' ? 'on' : ''}">Linear</button><button data-s="dist:log" class="${S.scale.dist === 'log' ? 'on' : ''}">Logarithmic</button></div>
      ${forced ? '<p style="color:var(--ink3);margin:2px 0 6px">Log distances use visible sizes; pick Linear for true scale.</p>' : ''}
      ${LAYERS.map(([k, n]) => `<div class="lay"><span>${n}</span><button class="sw ${S.layers[k] ? 'on' : ''}" data-l="${k}" role="switch" aria-checked="${S.layers[k]}" aria-label="${n}"></button></div>`).join('')}
      <div class="k" style="color:var(--ink3);margin-top:6px">Planet Nine orbit (estimate)</div><div class="seg"><button data-p="brief" class="${S.p9 === 'brief' ? 'on' : ''}">a≈500 e≈0.3</button><button data-p="bb2021" class="${S.p9 === 'bb2021' ? 'on' : ''}">BB 2021: a≈380</button></div>`;
      body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const [k, v] = b.dataset.s.split(':'); App.actions.setScale(k, v); tabs(); });
      body.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { App.actions.toggleLayer(b.dataset.l); tabs(); });
      body.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { App.actions.setP9(b.dataset.p); tabs(); });
      body.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => App.actions.focus(b.dataset.f); b.onkeydown = (e) => { if (e.key === 'Enter') App.actions.focus(b.dataset.f); }; });
    } else if (S.tab === 'tonight') {
      const names = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres'];
      const rows = names.map(n => ctx.bodies[n]).filter(Boolean).map(b => ({ b, s: skyNow(b), el: elong(b) }));
      const when = E.jdToDate(App.sim.jd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      body.innerHTML = `<p style="color:var(--ink2);margin:0 0 4px">Where each world sits in Earth's sky on ${when}${S.time.live ? ' (now)' : ''}, from these live positions. Naked-eye planets glow gold when well clear of the Sun. Tap to fly there.</p>` + moonPhase() +
        rows.map(r => `<div class="tn ${r.el > 25 && ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Mercury'].includes(r.b.name) ? 'up' : ''}" data-f="${r.b.name}" role="button" tabindex="0"><b>${r.b.name}</b><span>${r.s || '—'}</span></div>`).join('') +
        oppositions() + `<p style="color:var(--ink3);margin:6px 0 0">Elongation only: rise times depend on latitude (Philadelphia ≈40°N).</p>`;
      body.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => App.actions.focus(b.dataset.f); b.onkeydown = (e) => { if (e.key === 'Enter') App.actions.focus(b.dataset.f); }; });
    } else if (S.tab === 'moons') {
      const groups = {}; ctx.list.filter(b => b.kind === 'moon').forEach(m => (groups[m.parent] = groups[m.parent] || []).push(m));
      body.innerHTML = `<p style="color:var(--ink2);margin:0 0 4px">${ctx.list.filter(b => b.kind === 'moon').length} moons modelled. Tap a group to show/hide it, a name to fly there.</p>` +
        Object.keys(groups).map(p => `<div class="mgrp"><button class="sw ${S.moonFilter[p] !== false ? 'on' : ''}" data-m="${p}" aria-label="Show moons of ${p}"></button> <b>${p}</b> <span style="background:none;color:var(--ink3)">${(ctx.bodies[p].moons || groups[p].length)} known</span><br>${groups[p].map(m => `<span data-f="${m.name}">${m.name}</span>`).join('')}</div>`).join('');
      body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { App.actions.toggleMoons(b.dataset.m); tabs(); });
      body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => App.actions.focus(b.dataset.f));
    } else {
      body.innerHTML = `<div class="about">
      <p><b>Planets</b>: JPL Standish “Keplerian Elements for Approximate Positions of the Major Planets”, Table 1 (valid 1800–2050), with secular rates; Kepler’s equation solved by Newton to 1e-12. <a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html">ssd.jpl.nasa.gov</a></p>
      <p><b>Moon</b>: Meeus mean lunar elements (~1°). <b>Other moons</b>: semi-major axis, period, inclination, eccentricity and radius from JPL SSD satellite tables; orbits sit in the parent’s equatorial plane and their orbital phase is <span class="est">illustrative</span>. ${ctx.list.filter(b => b.kind === 'moon').length} major, ring-shepherd and irregular moons are modelled (all of Uranus’s inner moons and Pluto’s five); the full catalogue (400+, incl. Saturn’s 2025 batch) is not yet loaded. <b>From Earth tonight</b>: geocentric elongation from these same positions.</p>
      <p><b>Physical data</b>: NASA NSSDC Planetary Fact Sheets; poles and rotation: IAU WGCCRE 2015.</p>
      <p><b>Dwarf planets, eTNOs, comets, ‘Oumuamua</b>: JPL Small-Body Database osculating elements, rounded, two-body propagation (hyperbolic for ‘Oumuamua). Perihelion dates for distant TNOs are <span class="est">estimates</span>; Ammonite’s position is illustrative.</p>
      <p><b>Belts, Kuiper belt, Oort cloud</b>: <span class="est">representative distributions</span> (seeded), not real objects: main belt 2.1–3.3 AU with Kirkwood gaps (3:1, 5:2, 7:3, 2:1), Trojans at L4/L5 of Jupiter, Hildas 3.7–4.2 AU, Kuiper 39–48 AU + scattered disk to ~1,000 AU, Hills cloud 2,000–20,000 AU, outer Oort to 100,000 AU. Sun’s gravitational edge ~1–2 ly <span class="est">estimate</span>.</p>
      <p><b>Heliosphere</b>: termination shock ~90 AU, heliopause ~121 AU (Voyager crossings), nose toward the interstellar inflow (λ≈255°), tail ~3× <span class="est">shape estimate</span>.</p>
      <p><b>Spacecraft</b>: direction and distance from NASA/JPL status (2025), extrapolated linearly; Pioneers are untracked <span class="est">model estimate</span>.</p>
      <p><b>Planet Nine</b> is <span class="est">HYPOTHETICAL</span>: Batygin & Brown (≈6 M⊕, i≈16°); two variants. Drawn at aphelion, where it would most likely be. Highlighted: the clustered eTNO orbits (Sedna, 2012 VP113, Leleākūhonua, Ammonite).</p>
      <p><b>Stars</b>: 39 bright stars at their catalogue RA/Dec/magnitude (Yale BSC) plus a <span class="est">representative</span> faint field and Milky Way band along the galactic plane.</p>
      <p><b>Lighting</b>: the Sun is the only light; moon shadows and eclipses are ray-tested against the Sun’s disc in the shader. Textures are procedural.</p>
      <p style="color:var(--ink3)">three.js patterns: CloudAI-X/threejs-skills.</p><p><b>Seasons and ring tilt</b>: subsolar latitude and Saturn's ring opening angle from the IAU poles and these live positions (~0.5°). <b>Surface features</b> placed at their real latitude/longitude (Great Red Spot, Jupiter's polar hazes and white ovals, Hellas, Tharsis volcanoes, Caloris, Saturn's hexagon) are hand-drawn approximations. <b>Phoebe ring</b>: Saturn's largest ring, ~59–300 Saturn radii, tilted with Saturn's orbit, very faint (shown brightened).</p></div>`;
    }
  }
  function init(c) {
    ctx = c;
    $('names').innerHTML = c.list.map(b => `<option value="${b.name}">`).join('');
    const go = () => { const q = $('search').value.trim().toLowerCase(); if (!q) return; const b = c.list.find(x => x.name.toLowerCase() === q) || c.list.find(x => x.name.toLowerCase().startsWith(q)) || c.list.find(x => x.name.toLowerCase().includes(q));
      if (b) { if (b.kind === 'moon' && !S.layers.moons) App.actions.toggleLayer('moons', true); App.actions.focus(b.name); toast('Flying to ' + b.name); $('search').value = ''; $('search').blur(); }
      else toast('Nothing called “' + $('search').value.trim() + '”'); };
    $('search').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $('search').addEventListener('change', go);
    $('btnDrawer').onclick = () => { $('drawer').hidden = !$('drawer').hidden; $('btnDrawer').classList.toggle('on', !$('drawer').hidden); if (!$('drawer').hidden) tabs(); };
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { App.actions.setTab(b.dataset.tab); tabs(); });
    $('bRev').onclick = () => { if (S.time.live) App.actions.realtime(); App.actions.reverse(); };
    $('search').title = 'Search (/) · Space pause · N now · R reverse · +/− speed · H Sun · L labels · Esc close';
    $('bPause').onclick = () => App.actions.togglePause(); $('cPlay').onclick = () => App.actions.togglePause();
    $('b1x').onclick = () => App.actions.realtime(); $('bNow').onclick = () => App.actions.now();
    $('speed').oninput = (e) => { const v = +e.target.value / 1000, r = Math.pow(10, v * LMAX) * (S.time.rate < 0 ? -1 : 1); App.actions.setRate(r); };
    $('jump').onchange = (e) => { try { App.actions.jumpTo(e.target.value); toast('Jumped to ' + e.target.value); } catch (er) { toast(er.message); } };
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') e.target.blur(); return; }
      const k = e.key;
      if (k === 'Escape') { $('card').hidden = true; document.body.classList.remove('cardOpen'); App.actions.setCard(false); $('drawer').hidden = true; $('btnDrawer').classList.remove('on'); }
      else if (k === '+' || k === '=' || k === '-') { const f = k === '-' ? 0.25 : 4, r = S.time.paused ? 60 : S.time.rate * f; App.actions.setRate(Math.sign(r || 1) * Math.max(1, Math.abs(r))); toast(fmtRate(S.time.rate)); }
    });
    if (window.cabinet && cabinet.onMemory) cabinet.onMemory(() => { try { const m = cabinet.recall('atlas', null); if (!m || !m.layers) return; let ch = false; for (const k in S.layers) if (typeof m.layers[k] === 'boolean' && m.layers[k] !== S.layers[k]) { S.layers[k] = m.layers[k]; ch = true; } if (m.scale && (m.scale.size !== S.scale.size || m.scale.dist !== S.scale.dist) && ['true', 'visible'].includes(m.scale.size) && ['log', 'linear'].includes(m.scale.dist)) { App.actions.setScale('size', m.scale.size); App.actions.setScale('dist', m.scale.dist); ch = true; }
      if ((m.p9 === 'brief' || m.p9 === 'bb2021') && m.p9 !== S.p9) { App.actions.setP9(m.p9); ch = true; }
      if (ch) { refresh(); if (!$('drawer').hidden) tabs(); } } catch (er) {} });
    refresh();
  }
  function refresh() {
    const t = S.time;
    $('bPause').textContent = t.paused ? '▶' : '⏸'; $('cPlay').textContent = t.paused ? '▶' : '⏸';
    $('bNow').classList.toggle('on', t.live); $('b1x').classList.toggle('on', !t.live && Math.abs(t.rate) === 1 && !t.paused); $('bRev').classList.toggle('on', t.rate < 0);
    $('speed').value = Math.round(Math.log10(Math.max(1, Math.abs(t.rate))) / LMAX * 1000);
  }
  function tick(fb, camDist, fov, H) {
    const d = E.jdToDate(App.sim.jd), t = S.time;
    const ds = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    $('date').textContent = ds; $('cDate').textContent = ds;
    $('rateTxt').textContent = t.paused ? 'Paused' : t.live ? 'Live · now' : fmtRate(t.rate) + (App.clampInfo() ? ' · ⚠' : '');
    $('rateTxt').title = App.clampInfo();
    const off = Math.abs(App.sim.jd - E.jdNow()); let pill = $('nowPill');
    if (!pill) { pill = document.createElement('button'); pill.id = 'nowPill'; pill.onclick = () => { App.actions.now(); toast('Back to now'); }; document.body.appendChild(pill); }
    pill.hidden = t.live || off < 1;
    if (!pill.hidden) pill.textContent = (off > 730 ? Math.round(off / 365.25) + ' years ' : off > 60 ? Math.round(off / 30.44) + ' months ' : Math.round(off) + ' days ') + (App.sim.jd > E.jdNow() ? 'ahead' : 'ago') + ' · Back to now';
    const e = ctx.bodies.Earth; $('cEarth').textContent = 'Earth ' + Math.hypot(...e.h).toFixed(3) + ' AU from Sun' + (t.live ? ' · now' : '');
    const sc = $('scale'); sc.style.display = 'block';
    if (S.scale.dist === 'linear') {
      const unitsPx = 2 * camDist * Math.tan(fov * Math.PI / 360) / H, auBar = unitsPx * 80 / 100;
      $('scaleTxt').textContent = auBar < 0.01 ? Math.round(auBar * E.AU_KM).toLocaleString() + ' km' : auBar > 60000 ? (auBar / 63241).toFixed(2) + ' ly' : au(auBar);
      $('ltTxt').textContent = 'Bar = ' + E.lightTime(auBar);
      $('scaleBar').style.display = '';
    } else { $('scaleBar').style.display = 'none'; $('scaleTxt').textContent = 'Log distance scale'; $('ltTxt').textContent = fb.name === 'Sun' ? '' : fb.name + ': ' + E.lightTime(Math.hypot(...fb.h)) + ' from Sun'; }
    if (sel && !$('card').hidden) card();
    if (S.tab === 'tonight' && !$('drawer').hidden && (tick.n = (tick.n || 0) + 1) % 8 === 0) tabs();
  }
  let toastT = 0;
  function toast(msg) { let el = $('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1400); }
  function select(b, quiet) { sel = b; if (!quiet) { App.actions.setCard(true); card(); } else if (S.card) card(); }
  return { init, refresh, tick, select, info, tabs };
})();

// Actions: usable from chat, voice and other thinklets
(function () {
  if (!window.cabinet || !cabinet.actions) return;
  const A = App.actions;
  const find = (n) => { const q = String(n || '').toLowerCase().trim(); const L = App.ui && App.bodies ? Object.values(App.bodies) : [];
    return L.find(b => b.name.toLowerCase() === q) || L.find(b => b.name.toLowerCase().startsWith(q)) || L.find(b => b.name.toLowerCase().includes(q)); };
  try {
    cabinet.actions.define('focusBody', { description: 'Fly to and follow a body (planet, moon, dwarf planet, comet, spacecraft)', input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      (a) => { const b = find(a.name); if (!b) throw new Error('No body called ' + a.name); A.focus(b.name); return { message: 'Following ' + b.name }; });
    cabinet.actions.define('setTime', { description: 'Set the time: a date (YYYY-MM-DD), "now", or a speed in seconds per second (negative reverses)', input: { type: 'object', properties: { date: { type: 'string' }, rate: { type: 'number' } } } },
      (a) => { if (a.date === 'now' || (!a.date && a.rate == null)) { A.now(); return { message: 'Back to now' }; } if (a.date) A.jumpTo(a.date); if (a.rate != null) A.setRate(a.rate); return { message: 'Time set' + (a.date ? ' to ' + a.date : '') }; });
    cabinet.actions.define('toggleLayer', { description: 'Show or hide a layer: orbits, labels, moons, belts, kuiper, oort, helio, p9, craft, comets, stars, milky', input: { type: 'object', properties: { layer: { type: 'string' }, on: { type: 'boolean' } }, required: ['layer'] } },
      (a) => { const v = A.toggleLayer(a.layer, a.on); return { message: a.layer + (v ? ' shown' : ' hidden') }; });
    cabinet.actions.define('whereIs', { description: 'Where a body is right now: distance from the Sun and Earth, and light-time', readOnly: true, input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      (a) => { const b = find(a.name); if (!b || !App.ui.info || !b.h) throw new Error('No body called ' + a.name);
        const i = App.ui.info(b); return { message: `${b.name}: ${i.rSunAU.toFixed(3)} AU from the Sun, ${i.rEarthAU.toFixed(3)} AU from Earth (${i.lightFromEarth}).`, ...i }; });
    cabinet.describeMemory && cabinet.describeMemory({ atlas: 'settings { v:1, time:{live,jd,rate,paused}, camera:{focus,dist,az,el}, layers:{orbits,labels,moons,belts,kuiper,oort,helio,p9,craft,comets,stars,milky}, moonFilter:{Jupiter:false…}, scale:{size:"true"|"visible", dist:"linear"|"log"}, p9:"brief"|"bb2021", tab }' });
    cabinet.onMemory && cabinet.onMemory(() => {});
  } catch (e) { console.warn(e); }
})();
