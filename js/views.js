// Saved views: named bookmarks of the Atlas (the body in focus, the date or live, layers, sizes and distances).
// Kept under the memory key "views" as { v: 1, list: [...] }, newest first, up to 6. Shown at the top of the Layers tab,
// and usable from chat through saveView, goToView and listViews. index.html's Atlas module reads it through App.views.
window.App = window.App || {};
App.views = (function () {
  const MAX = 6, KEY = 'views';
  const LAYER_KEYS = ['orbits', 'labels', 'moons', 'belts', 'kuiper', 'oort', 'helio', 'p9', 'craft', 'comets', 'stars', 'milky'];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateText = (jd) => App.E.jdToDate(jd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  // Reads the saved views, checking every field: an unreadable entry is dropped, never guessed at
  function load() {
    let m = null; try { m = window.cabinet && cabinet.recall ? cabinet.recall(KEY, null) : null; } catch (e) {}
    const src = m && Array.isArray(m.list) ? m.list : [];
    return src.filter(v => v && typeof v.id === 'string' && typeof v.name === 'string').slice(0, MAX).map(v => {
      const layers = {};
      LAYER_KEYS.forEach(k => { layers[k] = !v.layers || typeof v.layers[k] !== 'boolean' ? true : v.layers[k]; });
      return {
        id: v.id.slice(0, 40), name: v.name.slice(0, 60) || 'View', at: Number.isFinite(v.at) ? v.at : 0,
        focus: typeof v.focus === 'string' && v.focus.length < 40 ? v.focus : 'Sun',
        jd: Number.isFinite(v.jd) && v.jd > 2086302.5 && v.jd < 2817152.5 ? v.jd : null,
        layers, size: v.size === 'true' ? 'true' : 'visible', dist: v.dist === 'linear' ? 'linear' : 'log'
      };
    });
  }
  let list = load();
  function save() { try { cabinet.remember(KEY, { v: 1, list }); } catch (e) {} }

  // What a view holds right now: the body in focus, the Atlas date (null when live), and the layers and scale
  function snapshot(name) {
    const S = App.state;
    return { id: 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, at: Date.now(),
      focus: S.camera.focus, jd: S.time.live ? null : App.sim.jd, layers: { ...S.layers }, size: S.scale.size, dist: S.scale.dist };
  }

  // Saves the current view under a readable name ("Saturn · now" or "Saturn · Mar 3, 2031")
  function saveCurrent() {
    if (list.length >= MAX) throw new Error('Six views are saved: remove one to make room.');
    const S = App.state, when = S.time.live ? 'now' : dateText(App.sim.jd);
    const v = snapshot(S.camera.focus + ' · ' + when);
    list = [v, ...list]; save(); return v;
  }

  // Goes back to a view: layers and sizes first, then the date, then the body (so the camera flies to it last)
  function go(id) {
    const v = list.find(x => x.id === id); if (!v) throw new Error('That view is gone.');
    if (!App.bodies || !App.bodies[v.focus]) throw new Error(v.focus + ' is not in the Atlas any more.');
    const A = App.actions;
    Object.keys(v.layers).forEach(k => { if (App.state.layers[k] !== v.layers[k]) A.toggleLayer(k, v.layers[k]); });
    A.setScale('size', v.size); A.setScale('dist', v.dist);
    if (v.jd == null) A.now(); else A.jumpTo(App.E.jdToDate(v.jd));
    A.focus(v.focus);
    return v;
  }
  function remove(id) { list = list.filter(v => v.id !== id); save(); }
  function byName(n) {
    const q = String(n || '').toLowerCase().trim();
    return list.find(v => v.name.toLowerCase() === q) || list.find(v => v.name.toLowerCase().includes(q));
  }

  // The Layers tab section: the saved views, then the button that saves the current one
  function html() {
    const rows = list.map(v => `<div class="vw"><button data-vgo="${esc(v.id)}" title="Go back to this view">${esc(v.name)}</button>` +
      `<span class="vs">${v.jd == null ? 'live' : dateText(v.jd)}</span><button class="vx" data-vdel="${esc(v.id)}" aria-label="Remove ${esc(v.name)}">×</button></div>`).join('');
    return `<div class="k" style="color:var(--ink3)">Saved views</div>` +
      (list.length ? rows : `<p class="vempty">No saved views yet. Save the body, date and layers you are looking at.</p>`) +
      `<div class="seg"><button data-vsave="1"${list.length >= MAX ? ' disabled title="Remove a view to make room"' : ''}>Save this view</button></div>`;
  }

  // Wires the buttons from a tap; redraw rebuilds the tab after a change
  function bind(body, redraw) {
    const toast = (m) => { if (App.ui && App.ui.toast) App.ui.toast(m); };
    body.querySelectorAll('[data-vsave]').forEach(b => b.onclick = () => {
      try { const v = saveCurrent(); toast('Saved “' + v.name + '”'); redraw(); } catch (e) { toast(e.message); }
    });
    body.querySelectorAll('[data-vgo]').forEach(b => b.onclick = () => {
      try { const v = go(b.dataset.vgo); toast('Back to “' + v.name + '”'); redraw(); } catch (e) { toast(e.message); }
    });
    body.querySelectorAll('[data-vdel]').forEach(b => b.onclick = () => {
      const v = list.find(x => x.id === b.dataset.vdel); remove(b.dataset.vdel); toast('Removed “' + (v ? v.name : 'view') + '”'); redraw();
    });
  }

  // Chat and voice: save the view, go back to one by name, or list them
  if (window.cabinet && cabinet.actions && cabinet.actions.define) {
    try {
      cabinet.actions.define('saveView', { description: 'Save the current Atlas view as a bookmark: the body in focus, the date (or live), layers and sizes', input: { type: 'object', properties: {} } },
        () => { const v = saveCurrent(); return { message: 'Saved view “' + v.name + '”.', id: v.id, name: v.name }; });
      cabinet.actions.define('goToView', { description: 'Go back to a saved Atlas view by its name', input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
        (a) => { const v = byName(a.name); if (!v) throw new Error('No saved view called ' + (a.name || 'that') + '.'); go(v.id); return { message: 'Back to “' + v.name + '”.', name: v.name }; });
      cabinet.actions.define('listViews', { description: 'List the saved Atlas views', readOnly: true, input: { type: 'object', properties: {} } },
        () => ({ message: list.length ? 'Saved views: ' + list.map(v => v.name).join('; ') + '.' : 'No saved views yet.', names: list.map(v => v.name) }));
    } catch (e) { console.warn(e); }
  }
  if (window.cabinet && cabinet.onMemory) cabinet.onMemory(() => { list = load(); });

  return { html, bind, saveCurrent, go, remove, list: () => list.slice() };
})();
