window.App = window.App || {};
(function () {
  const D2R = Math.PI / 180, EPS = 23.43928 * D2R, K = 0.01720209895, J2000 = 2451545.0;
  const E = {};
  E.J2000 = J2000; E.D2R = D2R; E.AU_KM = 149597870.7; E.LT_AU_S = 499.004784;
  E.jdNow = () => Date.now() / 864e5 + 2440587.5;
  E.jdToDate = (jd) => new Date((jd - 2440587.5) * 864e5);
  E.dateToJd = (d) => d.getTime() / 864e5 + 2440587.5;
  E.isoToJd = (s) => E.dateToJd(new Date(s + 'T00:00:00Z'));
  const wrap = (a) => { a %= 2 * Math.PI; if (a > Math.PI) a -= 2 * Math.PI; if (a < -Math.PI) a += 2 * Math.PI; return a; };
  E.kepler = (M, e) => {
    M = wrap(M); let x = e < 0.8 ? M : (M >= 0 ? Math.PI : -Math.PI);
    for (let k = 0; k < 60; k++) { const d = (x - e * Math.sin(x) - M) / (1 - e * Math.cos(x)); x -= d; if (Math.abs(d) < 1e-12) break; }
    return x;
  };
  E.hyperKepler = (M, e) => {
    let H = Math.asinh(M / e);
    for (let k = 0; k < 60; k++) { const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1); H -= d; if (Math.abs(d) < 1e-12) break; }
    return H;
  };
  // orbital-plane (xp, yp) -> ecliptic, angles in radians
  E.rot = (xp, yp, i, O, w, out) => {
    const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i);
    out = out || [0, 0, 0];
    out[0] = (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp;
    out[1] = (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp;
    out[2] = (sw * si) * xp + (cw * si) * yp;
    return out;
  };
  E.ellipse = (a, e, i, O, w, M, out) => {
    const Ea = E.kepler(M, e);
    return E.rot(a * (Math.cos(Ea) - e), a * Math.sqrt(1 - e * e) * Math.sin(Ea), i, O, w, out);
  };
  E.standishEl = (el, jd) => {
    const T = (jd - J2000) / 36525;
    const a = el[0] + el[1] * T, e = el[2] + el[3] * T, I = el[4] + el[5] * T, L = el[6] + el[7] * T, vp = el[8] + el[9] * T, O = el[10] + el[11] * T;
    return { a, e, i: I * D2R, O: O * D2R, w: (vp - O) * D2R, M: (L - vp) * D2R, L: L * D2R };
  };
  E.planet = (el, jd, out) => { const k = E.standishEl(el, jd); return E.ellipse(k.a, k.e, k.i, k.O, k.w, k.M, out); };
  E.smallEl = (o) => { if (!o._tp) o._tp = E.isoToJd(o.tp); return o; };
  E.small = (o, jd, out) => {
    E.smallEl(o);
    const i = o.i * D2R, O = o.O * D2R, w = o.w * D2R;
    if (o.e < 1) { const n = K / Math.pow(o.a, 1.5); return E.ellipse(o.a, o.e, i, O, w, n * (jd - o._tp), out); }
    const aa = o.q / (o.e - 1), n = K / Math.pow(aa, 1.5), H = E.hyperKepler(n * (jd - o._tp), o.e);
    return E.rot(aa * (o.e - Math.cosh(H)), aa * Math.sqrt(o.e * o.e - 1) * Math.sinh(H), i, O, w, out);
  };
  // Earth's Moon, geocentric ecliptic km (Meeus mean elements; ~1° accuracy)
  E.moonEl = (jd) => {
    const T = (jd - J2000) / 36525;
    const L = 218.3165 + 481267.8813 * T, O = 125.0445 - 1934.1363 * T, vp = 83.3532 + 4069.0137 * T;
    return { a: 384400, e: 0.0549, i: 5.145 * D2R, O: O * D2R, w: (vp - O) * D2R, M: (L - vp) * D2R };
  };
  E.moonGeo = (jd, out) => { const k = E.moonEl(jd); return E.ellipse(k.a, k.e, k.i, k.O, k.w, k.M, out); };
  E.equToEcl = (x, y, z) => [x, y * Math.cos(EPS) + z * Math.sin(EPS), -y * Math.sin(EPS) + z * Math.cos(EPS)];
  E.radec = (ra, dec) => { const r = ra * D2R, d = dec * D2R; return E.equToEcl(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)); };
  E.galToEcl = (l, b) => {
    const L = l * D2R, B = b * D2R, gx = Math.cos(B) * Math.cos(L), gy = Math.cos(B) * Math.sin(L), gz = Math.sin(B);
    const x = -0.0548755604 * gx - 0.8734370902 * gy - 0.4838350155 * gz;
    const y = 0.4941094279 * gx - 0.4448296300 * gy + 0.7469822445 * gz;
    const z = -0.8676661490 * gx - 0.1980763734 * gy + 0.4559837762 * gz;
    return E.equToEcl(x, y, z);
  };
  E.craft = (c, jd, out) => {
    const u = c._u || (c._u = E.radec(c.ra, c.dec));
    const yrs = (jd - E.isoToJd('2025-01-01')) / 365.25, d = Math.max(1, c.d0 + c.v * yrs);
    out = out || [0, 0, 0]; out[0] = u[0] * d; out[1] = u[1] * d; out[2] = u[2] * d; return out;
  };
  E.lightTime = (au) => {
    const s = au * E.LT_AU_S;
    if (s < 120) return s.toFixed(1) + ' light-s';
    if (s < 7200) return (s / 60).toFixed(1) + ' light-min';
    if (s < 86400 * 3) return (s / 3600).toFixed(1) + ' light-h';
    if (s < 86400 * 365.25) return (s / 86400).toFixed(1) + ' light-days';
    return (s / 86400 / 365.25).toFixed(2) + ' light-yr';
  };
  App.E = E;
})();
