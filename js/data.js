window.App = window.App || {};
// All values from published sources (see About). est:true marks estimates.
App.D = {
  // JPL Standish, "Keplerian Elements for Approximate Positions of the Major Planets", Table 1 (1800–2050 AD), J2000 ecliptic.
  // [a, da, e, de, I, dI, L, dL, varpi, dvarpi, Omega, dOmega] per Julian century
  standish: {
    Mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
    Venus: [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
    Earth: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
    Mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
    Jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
    Saturn: [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
    Uranus: [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
    Neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
    Pluto: [39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482]
  },
  // NASA NSSDC fact sheets + IAU WGCCRE 2015 poles. R km, mass kg, rotation hours (negative = retrograde), pole RA/Dec deg
  planets: [
    { name: 'Mercury', R: 2439.7, mass: 3.301e23, rot: 1407.6, tilt: 0.03, pole: [281.01, 61.41], type: 0, c: ['#8a8784', '#56524f', '#c4beb6'], moons: 0, disc: 'Known since antiquity' },
    { name: 'Venus', R: 6051.8, mass: 4.867e24, rot: -5832.5, tilt: 177.4, pole: [272.76, 67.16], type: 3, c: ['#e8cf9a', '#c9a86a', '#f3e2bd'], atm: [1, .85, .6], moons: 0, disc: 'Known since antiquity' },
    { name: 'Earth', R: 6371.0, mass: 5.972e24, rot: 23.9345, tilt: 23.44, pole: [0, 90], type: 1, c: ['#1d4f8a', '#3a7a3a', '#ffffff'], atm: [.35, .6, 1], moons: 1, disc: '—' },
    { name: 'Mars', R: 3389.5, mass: 6.417e23, rot: 24.6229, tilt: 25.19, pole: [317.68, 52.89], type: 0, c: ['#c1693c', '#6e3b25', '#e0b48a'], atm: [1, .6, .4], moons: 2, disc: 'Known since antiquity' },
    { name: 'Jupiter', R: 69911, mass: 1.898e27, rot: 9.925, tilt: 3.13, pole: [268.06, 64.50], type: 2, c: ['#d8c3a0', '#a5785a', '#f1e7d8'], atm: [1, .9, .75], moons: 97, disc: 'Known since antiquity', ring: [1.72, 1.81, 0.06, '#a08a70'] },
    { name: 'Saturn', R: 58232, mass: 5.683e26, rot: 10.656, tilt: 26.73, pole: [40.59, 83.54], type: 2, c: ['#e3cf9e', '#b89a68', '#f5ead0'], atm: [1, .92, .7], moons: 274, disc: 'Known since antiquity', ring: [1.24, 2.33, 1, '#e6d4ae'] },
    { name: 'Uranus', R: 25362, mass: 8.681e25, rot: -17.24, tilt: 97.77, pole: [257.31, -15.18], type: 3, c: ['#9fd9e0', '#7fc0cc', '#cdf0f2'], atm: [.6, .9, 1], moons: 29, disc: '1781 · W. Herschel', ring: [1.6, 2.04, 0.12, '#8899aa'] },
    { name: 'Neptune', R: 24622, mass: 1.024e26, rot: 16.11, tilt: 28.32, pole: [299.36, 43.46], type: 2, c: ['#7fa9d0', '#5f8cbc', '#b4d0e6'], atm: [.5, .72, .95], moons: 16, disc: '1846 · Galle, Le Verrier, Adams', ring: [1.65, 2.6, 0.08, '#7083a8'] }
  ],
  // Dwarf planets, eTNOs, comets (JPL SBDB osculating elements, rounded). tp = perihelion date. est = rounded / approximate
  small: [
    { name: 'Ceres', kind: 'dwarf', a: 2.7675, e: 0.0785, i: 10.59, O: 80.30, w: 73.60, tp: '2022-12-07', R: 469.7, mass: 9.38e20, rot: 9.07, disc: '1801 · G. Piazzi', moons: 0, c: '#9a948c' },
    { name: 'Pluto', kind: 'dwarf', standish: true, R: 1188.3, mass: 1.303e22, rot: -153.29, pole: [132.99, -6.16], disc: '1930 · C. Tombaugh', moons: 5, c: '#c9b49a' },
    { name: 'Haumea', kind: 'dwarf', a: 43.12, e: 0.195, i: 28.21, O: 122.16, w: 239.0, tp: '2133-05-01', R: 1050, axes: [1, 0.51, 0.80], mass: 4.006e21, rot: 3.915, disc: '2004–05 · Brown et al. / Ortiz et al.', moons: 2, c: '#e8e6e2', ring: 2287, est: true },
    { name: 'Makemake', kind: 'dwarf', a: 45.43, e: 0.161, i: 29.0, O: 79.6, w: 296.5, tp: '2186-01-01', R: 715, mass: 3.1e21, rot: 22.83, disc: '2005 · Brown, Trujillo, Rabinowitz', moons: 1, c: '#c98e6a', est: true },
    { name: 'Eris', kind: 'dwarf', a: 67.86, e: 0.436, i: 44.04, O: 35.95, w: 151.6, tp: '2257-01-01', R: 1163, mass: 1.66e22, rot: 378.9, disc: '2005 · Brown, Trujillo, Rabinowitz', moons: 1, c: '#e9e5df', est: true },
    { name: 'Gonggong', kind: 'dwarf', a: 67.4, e: 0.50, i: 30.6, O: 336.8, w: 206.6, tp: '1857-01-01', R: 615, mass: 1.75e21, rot: 22.4, disc: '2007 · Schwamb, Brown, Rabinowitz', moons: 1, c: '#b46a52', est: true },
    { name: 'Quaoar', kind: 'dwarf', a: 43.69, e: 0.04, i: 7.99, O: 188.8, w: 147.5, tp: '2075-01-01', R: 555, mass: 1.2e21, rot: 17.68, disc: '2002 · Trujillo, Brown', moons: 1, c: '#a97d64', est: true },
    { name: 'Orcus', kind: 'dwarf', a: 39.17, e: 0.22, i: 20.57, O: 268.8, w: 73.7, tp: '1896-01-01', R: 455, mass: 6.3e20, rot: 10.5, disc: '2004 · Brown, Trujillo, Rabinowitz', moons: 1, c: '#a9a6a3', est: true },
    { name: 'Sedna', kind: 'etno', a: 506, e: 0.855, i: 11.93, O: 144.4, w: 311.3, tp: '2076-01-01', R: 500, rot: 10.3, disc: '2003 · Brown, Trujillo, Rabinowitz', moons: 0, c: '#c8553d', est: true },
    { name: '2012 VP113', kind: 'etno', a: 262, e: 0.69, i: 24.1, O: 90.8, w: 293.0, tp: '1979-01-01', R: 300, disc: '2012 · Trujillo, Sheppard', moons: 0, c: '#c97a6a', est: true },
    { name: 'Leleākūhonua', kind: 'etno', a: 1090, e: 0.94, i: 11.7, O: 300.8, w: 118.0, tp: '2078-01-01', R: 110, disc: '2015 · Sheppard, Tholen, Trujillo', moons: 0, c: '#d48a7a', est: true },
    { name: 'Ammonite', kind: 'etno', a: 252, e: 0.74, i: 11.0, O: 72.0, w: 198.0, tp: '2030-01-01', R: 110, disc: '2023 · FOSSIL survey (2023 KQ14)', moons: 0, c: '#d4a07a', est: true, posIllustrative: true },
    { name: '2013 SY99', kind: 'etno', a: 730, e: 0.93, i: 4.2, O: 29.5, w: 32.3, tp: '2012-01-01', R: 125, disc: '2013 · OSSOS survey', moons: 0, c: '#c97a6a', est: true, posIllustrative: true },
    { name: '2004 VN112', kind: 'etno', a: 319, e: 0.85, i: 25.6, O: 66.0, w: 327.1, tp: '1990-01-01', R: 65, disc: '2004 · Deep Ecliptic Survey', moons: 0, c: '#c97a6a', est: true, posIllustrative: true },
    { name: '2010 GB174', kind: 'etno', a: 350, e: 0.87, i: 21.5, O: 130.6, w: 347.8, tp: '1950-01-01', R: 120, disc: '2010 · Chen et al. (CFHT)', moons: 0, c: '#c97a6a', est: true, posIllustrative: true },
    { name: 'Parker Solar Probe', kind: 'probe', a: 0.3881, e: 0.8829, i: 3.4, O: 76.0, w: 293.0, tp: '2024-12-24', R: 0.002, disc: 'Launched 2018 · closest-ever pass 6.9 million km', moons: 0, c: '#7fd4ff', est: true },
    { name: 'Salacia', kind: 'dwarf', a: 42.2, e: 0.106, i: 23.9, O: 280.3, w: 312.0, tp: '1989-01-01', R: 423, mass: 4.9e20, rot: 6.1, disc: '2004 · Roe, Brown, Barkume (dwarf candidate)', moons: 1, c: '#8f857c', est: true, posIllustrative: true },
    { name: 'Varda', kind: 'dwarf', a: 45.5, e: 0.14, i: 21.5, O: 184.1, w: 180.0, tp: '2096-01-01', R: 370, mass: 2.45e20, rot: 5.9, disc: '2003 · Larsen (Spacewatch) (dwarf candidate)', moons: 1, c: '#b08a70', est: true, posIllustrative: true },
    { name: 'Kamoʻoalewa', kind: 'minor', a: 1.0009, e: 0.103, i: 7.8, O: 66.0, w: 307.0, tp: '2026-03-01', R: 0.025, rot: 0.47, disc: '2016 · Pan-STARRS · Earth quasi-satellite, maybe lunar ejecta', moons: 0, c: '#b07050', est: true },
    { name: 'Psyche', kind: 'minor', a: 2.924, e: 0.134, i: 3.10, O: 150.0, w: 229.0, tp: '2024-05-01', R: 111, mass: 2.29e19, rot: 4.196, disc: '1852 · A. de Gasparis · metal-rich, NASA Psyche arrives 2029', moons: 0, c: '#9a9a96', est: true },
    { name: 'Vesta', kind: 'minor', a: 2.3615, e: 0.0887, i: 7.14, O: 103.81, w: 151.20, tp: '2021-12-26', R: 262.7, mass: 2.59e20, rot: 5.342, disc: '1807 · H. Olbers', moons: 0, c: '#a39a8c', est: true },
    { name: 'Pallas', kind: 'minor', a: 2.7700, e: 0.2302, i: 34.93, O: 172.90, w: 310.90, tp: '2023-02-21', R: 256, mass: 2.04e20, rot: 7.813, disc: '1802 · H. Olbers', moons: 0, c: '#8e8a86', est: true },
    { name: 'Hygiea', kind: 'minor', a: 3.1420, e: 0.1125, i: 3.83, O: 283.20, w: 312.30, tp: '2023-07-01', R: 217, mass: 8.7e19, rot: 13.83, disc: '1849 · A. de Gasparis', moons: 0, c: '#6f6a66', est: true },
    { name: 'Arrokoth', kind: 'minor', a: 44.58, e: 0.042, i: 2.45, O: 158.90, w: 174.40, tp: '2010-01-01', R: 18, rot: 15.92, disc: '2014 · New Horizons team (flyby 2019)', moons: 0, c: '#b0583c', est: true, posIllustrative: true },
    { name: 'Apophis', kind: 'minor', a: 0.9224, e: 0.1912, i: 3.34, O: 203.9, w: 126.6, tp: '2026-01-20', R: 0.17, rot: 30.6, disc: '2004 · Tucker, Tholen, Bernardi · passes 32,000 km from Earth on 13 Apr 2029', moons: 0, c: '#a08a78', est: true },
    { name: 'Bennu', kind: 'minor', a: 1.126, e: 0.2037, i: 6.03, O: 2.06, w: 66.2, tp: '2023-09-25', R: 0.245, rot: 4.296, disc: '1999 · LINEAR · OSIRIS-REx sample returned 2023', moons: 0, c: '#5a5652', est: true },
    { name: '2010 TK7', kind: 'minor', a: 1.0004, e: 0.19, i: 20.9, O: 96.5, w: 45.8, tp: '2026-03-01', R: 0.15, disc: '2010 · WISE · first known Earth Trojan (L4)', moons: 0, c: '#9a8a7a', est: true, posIllustrative: true },
    { name: 'Zoozve', kind: 'minor', a: 0.7236, e: 0.41, i: 9.0, O: 231.6, w: 355.6, tp: '2026-01-01', R: 0.12, disc: '2002 · LINEAR · Venus quasi-satellite', moons: 0, c: '#9a8a7a', est: true, posIllustrative: true },
    { name: 'Eros', kind: 'minor', a: 1.458, e: 0.2229, i: 10.83, O: 304.3, w: 178.9, tp: '2025-01-26', R: 8.4, rot: 5.27, disc: '1898 · G. Witt · first near-Earth asteroid, NEAR Shoemaker landed 2001', moons: 0, c: '#a08a70', est: true, posIllustrative: true },
    { name: 'Ryugu', kind: 'minor', a: 1.191, e: 0.1903, i: 5.87, O: 251.3, w: 211.6, tp: '2025-08-01', R: 0.45, rot: 7.63, disc: '1999 · LINEAR · Hayabusa2 sample returned 2020', moons: 0, c: '#4e4a46', est: true, posIllustrative: true },
    { name: 'Didymos', kind: 'minor', a: 1.6427, e: 0.3832, i: 3.41, O: 72.99, w: 319.6, tp: '2024-10-01', R: 0.39, rot: 2.26, disc: '1996 · Spacewatch · DART struck its moonlet Dimorphos 2022', moons: 1, c: '#8a8078', est: true, posIllustrative: true },
    { name: 'Chiron', kind: 'minor', a: 13.69, e: 0.379, i: 6.93, O: 209.3, w: 339.2, tp: '1996-02-14', R: 103, rot: 5.92, disc: '1977 · C. Kowal · first Centaur, comet activity', moons: 0, c: '#7a7672', est: true },
    { name: 'Chariklo', kind: 'minor', a: 15.87, e: 0.171, i: 23.4, O: 300.4, w: 241.6, tp: '2003-11-01', R: 124, rot: 7.0, disc: '1997 · Spacewatch · first small body found with rings (2013)', moons: 0, c: '#6a625c', est: true, ring: 391 },
    { name: 'Ixion', kind: 'dwarf', a: 39.35, e: 0.244, i: 19.6, O: 71.1, w: 300.7, tp: '2070-01-01', R: 355, rot: 12.4, disc: '2001 · Deep Ecliptic Survey · plutino (dwarf candidate)', moons: 0, c: '#9a6a52', est: true, posIllustrative: true },
    { name: 'Varuna', kind: 'dwarf', a: 42.9, e: 0.051, i: 17.1, O: 97.3, w: 273.2, tp: '1928-01-01', R: 339, rot: 6.34, axes: [1, 0.7, 0.62], disc: '2000 · R. McMillan (Spacewatch) · elongated fast rotator', moons: 0, c: '#9a7a66', est: true, posIllustrative: true },
    { name: 'Huya', kind: 'dwarf', a: 39.2, e: 0.28, i: 15.5, O: 169.3, w: 67.5, tp: '2015-01-01', R: 203, rot: 6.75, disc: '2000 · I. Ferrín · plutino', moons: 0, c: '#a07a66', est: true, posIllustrative: true },
    { name: '2002 MS4', kind: 'dwarf', a: 41.9, e: 0.14, i: 17.7, O: 216.1, w: 213.0, tp: '2123-01-01', R: 400, rot: 7.33, disc: '2002 · Trujillo, Brown · largest unnamed TNO', moons: 0, c: '#8a827a', est: true, posIllustrative: true },
    { name: 'Juno', kind: 'minor', a: 2.670, e: 0.2562, i: 12.99, O: 169.85, w: 247.9, tp: '2023-05-01', R: 123, mass: 2.7e19, rot: 7.21, disc: '1804 · K. Harding', moons: 0, c: '#9a9288', est: true, posIllustrative: true },
    { name: 'Hektor', kind: 'minor', a: 5.26, e: 0.023, i: 18.17, O: 342.8, w: 185.5, tp: '2021-01-01', R: 113, rot: 6.92, disc: '1907 · A. Kopff · largest Jupiter Trojan (L4), bilobed', moons: 0, c: '#6a5a50', est: true, posIllustrative: true },
    { name: 'Patroclus', kind: 'minor', a: 5.21, e: 0.14, i: 22.06, O: 44.4, w: 307.9, tp: '2019-01-01', R: 70, rot: 102.8, disc: '1906 · A. Kopff · Trojan binary, Lucy flyby 2033', moons: 0, c: '#6a6058', est: true, posIllustrative: true },
    { name: 'Halley', kind: 'comet', a: 17.83, e: 0.96714, i: 162.26, O: 58.42, w: 111.33, tp: '1986-02-09', R: 5.5, disc: 'Recorded 240 BC · periodicity E. Halley 1705', moons: 0, c: '#a8f0e0' },
    { name: 'Hale-Bopp', kind: 'comet', a: 186, e: 0.995, i: 89.43, O: 282.47, w: 130.59, tp: '1997-04-01', R: 30, disc: '1995 · A. Hale, T. Bopp', moons: 0, c: '#a8f0e0' },
    { name: 'Encke', kind: 'comet', a: 2.215, e: 0.8483, i: 11.78, O: 334.57, w: 186.54, tp: '2023-10-22', R: 2.4, disc: '1786 · P. Méchain', moons: 0, c: '#a8f0e0' },
    { name: '67P/Churyumov–Gerasimenko', kind: 'comet', a: 3.46, e: 0.641, i: 7.04, O: 50.1, w: 12.8, tp: '2021-11-02', R: 2.0, disc: '1969 · Churyumov, Gerasimenko · Rosetta orbited 2014–16', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Swift–Tuttle', kind: 'comet', a: 26.09, e: 0.9632, i: 113.45, O: 139.38, w: 152.98, tp: '1992-12-12', R: 13, disc: '1862 · Swift, Tuttle · parent of the Perseid meteors', moons: 0, c: '#a8f0e0', est: true },
    { name: "'Oumuamua", kind: 'comet', q: 0.2559, e: 1.2011, i: 122.74, O: 24.60, w: 241.81, tp: '2017-09-09', R: 0.1, disc: '2017 · R. Weryk (Pan-STARRS)', moons: 0, c: '#ffd0a0', hyper: true },
    { name: '3I/ATLAS', kind: 'comet', q: 1.3564, e: 6.139, i: 175.11, O: 322.16, w: 128.01, tp: '2025-10-29', R: 2.8, disc: '2025 · ATLAS (Chile), third interstellar object', moons: 0, c: '#ffd0a0', hyper: true, est: true },
    { name: 'Tempel 1', kind: 'comet', a: 3.145, e: 0.5096, i: 10.47, O: 68.75, w: 179.2, tp: '2022-03-04', R: 3.0, disc: '1867 · W. Tempel · Deep Impact struck it 2005', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Hartley 2', kind: 'comet', a: 3.47, e: 0.694, i: 13.6, O: 219.8, w: 181.3, tp: '2023-10-12', R: 0.6, disc: '1986 · M. Hartley · EPOXI flyby 2010', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Tsuchinshan–ATLAS', kind: 'comet', q: 0.3914, e: 1.0001, i: 139.11, O: 21.56, w: 308.49, tp: '2024-09-27', R: 5, disc: '2023 · Purple Mountain Obs. & ATLAS · great comet of Oct 2024', moons: 0, c: '#a8f0e0', hyper: true, est: true },
    { name: 'Phaethon', kind: 'minor', a: 1.271, e: 0.8898, i: 22.26, O: 265.2, w: 322.2, tp: '2025-12-24', R: 2.9, rot: 3.6, disc: '1983 · IRAS · rock comet, parent of the Geminid meteors', moons: 0, c: '#8a8480', est: true },
    { name: 'Tempel–Tuttle', kind: 'comet', a: 10.33, e: 0.9055, i: 162.49, O: 235.27, w: 172.5, tp: '1998-02-28', R: 1.8, disc: '1865–66 · Tempel, Tuttle · parent of the Leonid meteors', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Pons–Brooks', kind: 'comet', a: 17.2, e: 0.9546, i: 74.19, O: 255.86, w: 198.99, tp: '2024-04-21', R: 15, disc: '1812 · J.-L. Pons · returned 2024', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Ida', kind: 'minor', a: 2.862, e: 0.045, i: 1.13, O: 324.0, w: 110.0, tp: '2025-06-01', R: 15.7, rot: 4.63, disc: '1884 · J. Palisa · Galileo found its moon Dactyl 1993, first asteroid moon', moons: 1, c: '#9a8e80', est: true, posIllustrative: true },
    { name: 'Wild 2', kind: 'comet', a: 3.45, e: 0.537, i: 3.24, O: 136.1, w: 41.7, tp: '2022-12-15', R: 2.0, disc: '1978 · P. Wild · Stardust returned its dust 2006', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Borrelly', kind: 'comet', a: 3.61, e: 0.638, i: 30.3, O: 74.3, w: 351.9, tp: '2022-02-01', R: 2.4, disc: '1904 · A. Borrelly · Deep Space 1 flyby 2001', moons: 0, c: '#a8f0e0', est: true },
    { name: '8P/Tuttle', kind: 'comet', a: 5.7, e: 0.82, i: 54.98, O: 270.3, w: 207.5, tp: '2021-08-27', R: 2.9, disc: '1790 · Méchain, Tuttle 1858 · parent of the Ursid meteors', moons: 0, c: '#a8f0e0', est: true },
    { name: '2024 YR4', kind: 'minor', a: 2.516, e: 0.6616, i: 3.41, O: 271.37, w: 134.36, tp: '2024-11-22', R: 0.03, disc: '2024 · ATLAS (Chile) · briefly topped the impact-risk lists; ruled out for Earth 2032', moons: 0, c: '#9a8a7a', est: true },
    { name: 'Kleopatra', kind: 'minor', a: 2.795, e: 0.251, i: 13.11, O: 215.4, w: 180.2, tp: '2024-08-01', R: 61, rot: 5.385, disc: '1880 · J. Palisa · dog-bone metal-rich asteroid with two moons', moons: 2, c: '#8e8a84', est: true, posIllustrative: true },
    { name: 'Lutetia', kind: 'minor', a: 2.435, e: 0.164, i: 3.06, O: 80.86, w: 250.2, tp: '2024-03-01', R: 49, rot: 8.17, disc: '1852 · H. Goldschmidt · Rosetta flyby 2010', moons: 0, c: '#8a847c', est: true, posIllustrative: true },
    { name: 'NEOWISE', kind: 'comet', a: 270, e: 0.9992, i: 128.94, O: 61.01, w: 37.28, tp: '2020-07-03', R: 2.5, disc: '2020 · NEOWISE space telescope · great comet of July 2020', moons: 0, c: '#a8f0e0', est: true },
    { name: 'Itokawa', kind: 'minor', a: 1.324, e: 0.280, i: 1.62, O: 69.08, w: 162.8, tp: '2025-06-01', R: 0.165, rot: 12.13, disc: '1998 · LINEAR · Hayabusa returned the first asteroid sample 2010', moons: 0, c: '#9a8e7e', est: true, posIllustrative: true },
    { name: 'Dinkinesh', kind: 'minor', a: 2.191, e: 0.112, i: 2.09, O: 21.4, w: 66.4, tp: '2025-04-01', R: 0.39, rot: 52.7, disc: '1999 · LINEAR · Lucy flyby 2023 found contact-binary moon Selam', moons: 1, c: '#8e8478', est: true, posIllustrative: true },
    { name: 'Donaldjohanson', kind: 'minor', a: 2.383, e: 0.186, i: 4.42, O: 262.8, w: 212.9, tp: '2024-10-01', R: 4, rot: 252, disc: '1981 · E. Bowell · Lucy flyby Apr 2025', moons: 0, c: '#8a8078', est: true, posIllustrative: true },
    { name: 'Eurybates', kind: 'minor', a: 5.21, e: 0.09, i: 8.06, O: 43.5, w: 27.9, tp: '2022-01-01', R: 32, rot: 8.7, disc: '1973 · C.J. van Houten · Jupiter Trojan with moon Queta; Lucy flyby Aug 2027', moons: 1, c: '#6a6460', est: true, posIllustrative: true },
    { name: '2I/Borisov', kind: 'comet', q: 2.0066, e: 3.3565, i: 44.05, O: 308.15, w: 209.12, tp: '2019-12-08', R: 0.5, disc: '2019 · G. Borisov', moons: 0, c: '#ffd0a0', hyper: true }
  ],
  // Moons: [name, parent, a_km, R_km, period_days (neg = retrograde), incl_deg to parent equator, e]
  // a, R, P from JPL SSD satellite tables (rounded). Orbit phase is illustrative except Earth's Moon.
  moons: [
    ['Phobos', 'Mars', 9376, 11.3, 0.3189, 1.1, .015], ['Deimos', 'Mars', 23463, 6.2, 1.2624, 1.8, 0],
    ['Io', 'Jupiter', 421700, 1821.6, 1.7691, 0.04, .004], ['Europa', 'Jupiter', 671034, 1560.8, 3.5512, 0.47, .009], ['Ganymede', 'Jupiter', 1070412, 2634.1, 7.1546, 0.2, .001], ['Callisto', 'Jupiter', 1882709, 2410.3, 16.689, 0.19, .007],
    ['Amalthea', 'Jupiter', 181366, 83.5, 0.4982, 0.37, 0], ['Thebe', 'Jupiter', 221889, 49.3, 0.6745, 1.08, .018], ['Himalia', 'Jupiter', 11461000, 69.8, 250.56, 27.5, .16], ['Elara', 'Jupiter', 11741000, 43, 259.64, 26.6, .21],
    ['Pasiphae', 'Jupiter', 23624000, 30, -743.6, 151.4, .41], ['Sinope', 'Jupiter', 23939000, 19, -758.9, 158.1, .25], ['Carme', 'Jupiter', 23404000, 23, -734.2, 164.9, .25], ['Ananke', 'Jupiter', 21276000, 14, -629.8, 148.9, .24],
    ['Pan', 'Saturn', 133584, 14, 0.5750, 0, 0], ['Janus', 'Saturn', 151460, 89.5, 0.6945, 0.16, .007], ['Epimetheus', 'Saturn', 151410, 58.1, 0.6942, 0.35, .01],
    ['Mimas', 'Saturn', 185539, 198.2, 0.9424, 1.57, .02], ['Enceladus', 'Saturn', 237948, 252.1, 1.3702, 0.01, .005], ['Tethys', 'Saturn', 294619, 531.1, 1.8878, 1.12, 0], ['Dione', 'Saturn', 377396, 561.4, 2.7369, 0.02, .002],
    ['Rhea', 'Saturn', 527108, 763.8, 4.5175, 0.35, .001], ['Titan', 'Saturn', 1221870, 2574.7, 15.945, 0.35, .029], ['Hyperion', 'Saturn', 1500880, 135, 21.277, 0.43, .10], ['Iapetus', 'Saturn', 3560820, 734.5, 79.33, 15.47, .028],
    ['Phoebe', 'Saturn', 12947780, 106.5, -550.31, 175.3, .16],
    ['Puck', 'Uranus', 86000, 81, 0.7618, 0.32, 0], ['Miranda', 'Uranus', 129900, 235.8, 1.4135, 4.34, .001], ['Ariel', 'Uranus', 190900, 578.9, 2.5204, 0.04, .001], ['Umbriel', 'Uranus', 266000, 584.7, 4.1442, 0.13, .004],
    ['Titania', 'Uranus', 436300, 788.9, 8.7059, 0.08, .001], ['Oberon', 'Uranus', 583500, 761.4, 13.4632, 0.07, .001], ['Sycorax', 'Uranus', 12179000, 82, -1288.3, 159.4, .52],
    ['Larissa', 'Neptune', 73548, 97, 0.5547, 0.2, .001], ['Proteus', 'Neptune', 117647, 210, 1.1223, 0.04, 0], ['Triton', 'Neptune', 354759, 1353.4, -5.8769, 156.9, 0], ['Nereid', 'Neptune', 5513818, 170, 360.13, 7.1, .75],
    ['Charon', 'Pluto', 19591, 606, 6.3872, 0.0, 0], ['Nix', 'Pluto', 48694, 25, 24.856, 0.13, .002], ['Hydra', 'Pluto', 64738, 30, 38.202, 0.24, .006],
    ['Hiʻiaka', 'Haumea', 49880, 160, 49.12, 126, .05], ['Namaka', 'Haumea', 25657, 85, 18.28, 113, .25],
    ['Dysnomia', 'Eris', 37273, 350, 15.786, 0, .006], ['MK2', 'Makemake', 22250, 87, 12.4, 0, 0], ['Weywot', 'Quaoar', 13289, 85, 12.43, 0, .14],
    ['Vanth', 'Orcus', 9000, 221, 9.54, 0, 0], ['Xiangliu', 'Gonggong', 24021, 50, 25.22, 0, .29],
    // v3 additions (JPL SSD tables, rounded)
    ['Metis', 'Jupiter', 128000, 21.5, 0.2948, 0.06, 0], ['Adrastea', 'Jupiter', 129000, 8.2, 0.2983, 0.03, 0], ['Themisto', 'Jupiter', 7393000, 4.5, 130.0, 45.8, .24], ['Leda', 'Jupiter', 11165000, 10.8, 240.9, 27.5, .16], ['Lysithea', 'Jupiter', 11717000, 21, 259.2, 28.3, .11], ['Callirrhoe', 'Jupiter', 24103000, 4.3, -758.8, 147.1, .28],
    ['Atlas', 'Saturn', 137670, 15.1, 0.6019, 0, 0], ['Prometheus', 'Saturn', 139380, 43.1, 0.6130, 0.01, .002], ['Pandora', 'Saturn', 141720, 40.7, 0.6285, 0.05, .004], ['Telesto', 'Saturn', 294619, 12.4, 1.8878, 1.18, 0], ['Calypso', 'Saturn', 294619, 10.7, 1.8878, 1.5, 0], ['Helene', 'Saturn', 377396, 18, 2.7369, 0.2, 0],
    ['Kiviuq', 'Saturn', 11110000, 8, 449.2, 45.7, .33], ['Ijiraq', 'Saturn', 11124000, 6, 451.4, 46.4, .32], ['Paaliaq', 'Saturn', 15200000, 11, 686.9, 45.1, .36], ['Albiorix', 'Saturn', 16182000, 16, 783.5, 34.2, .48], ['Siarnaq', 'Saturn', 17531000, 20, 895.5, 46, .28], ['Ymir', 'Saturn', 23040000, 9, -1315.1, 173.1, .33],
    ['Cordelia', 'Uranus', 49800, 20, 0.3350, 0.08, 0], ['Ophelia', 'Uranus', 53800, 21, 0.3764, 0.1, .01], ['Bianca', 'Uranus', 59200, 26, 0.4346, 0.19, .001], ['Cressida', 'Uranus', 61800, 40, 0.4636, 0.01, 0], ['Desdemona', 'Uranus', 62700, 32, 0.4736, 0.11, 0], ['Juliet', 'Uranus', 64400, 47, 0.4931, 0.07, .001], ['Portia', 'Uranus', 66100, 68, 0.5132, 0.06, 0], ['Rosalind', 'Uranus', 69900, 36, 0.5585, 0.28, 0], ['Belinda', 'Uranus', 75300, 45, 0.6235, 0.03, 0],
    ['Caliban', 'Uranus', 7231000, 36, -579.7, 140.9, .16], ['Prospero', 'Uranus', 16256000, 25, -1977.3, 152, .44], ['Setebos', 'Uranus', 17418000, 24, -2234.8, 158.2, .59],
    ['Naiad', 'Neptune', 48227, 33, 0.2944, 4.69, 0], ['Thalassa', 'Neptune', 50074, 41, 0.3115, 0.14, 0], ['Despina', 'Neptune', 52526, 75, 0.3347, 0.07, 0], ['Galatea', 'Neptune', 61953, 88, 0.4287, 0.05, 0], ['Halimede', 'Neptune', 16611000, 31, -1879.7, 134.1, .57], ['Neso', 'Neptune', 49285000, 30, -9740.7, 132.6, .42],
    ['Kerberos', 'Pluto', 57783, 6, 32.17, 0.39, 0], ['Styx', 'Pluto', 42656, 5, 20.16, 0.81, 0],
    // v7 additions (JPL SSD tables, rounded)
    ['Daphnis', 'Saturn', 136505, 3.8, 0.5940, 0, 0], ['Methone', 'Saturn', 194440, 1.45, 1.0096, 0.01, 0], ['Pallene', 'Saturn', 212280, 2.2, 1.1537, 0.18, .004], ['Polydeuces', 'Saturn', 377200, 1.3, 2.7369, 0.18, .019],
    ['Carpo', 'Jupiter', 16989000, 1.5, 456.1, 51.4, .43], ['Cupid', 'Uranus', 74800, 9, 0.6130, 0.1, 0], ['Perdita', 'Uranus', 76417, 10, 0.6380, 0, .01], ['Mab', 'Uranus', 97736, 12, 0.9229, 0.13, .003],
    ['Hippocamp', 'Neptune', 105283, 17, 0.9500, 0, 0], ['Sao', 'Neptune', 22228000, 22, 2912.7, 49.9, .13],
    // v8 additions (JPL SSD tables, rounded)
    ['Tarvos', 'Saturn', 18239000, 7.5, 926.2, 33.8, .53], ['Mundilfari', 'Saturn', 18654000, 3.5, -952.6, 167.3, .21], ['Skathi', 'Saturn', 15540000, 4, -728.2, 152.6, .27], ['Erriapus', 'Saturn', 17343000, 5, 871.2, 34.6, .47],
    ['Narvi', 'Saturn', 19007000, 3.5, -1003.9, 145.8, .43], ['Suttungr', 'Saturn', 19459000, 3.5, -1016.7, 175.8, .11], ['Thrymr', 'Saturn', 20314000, 3.5, -1094.3, 176, .47], ['Bebhionn', 'Saturn', 17119000, 3, 834.8, 35, .47],
    ['Kalyke', 'Jupiter', 23583000, 2.6, -743, 165.2, .25], ['Iocaste', 'Jupiter', 21269000, 2.6, -631.5, 149.4, .22], ['Praxidike', 'Jupiter', 21147000, 3.4, -625.4, 149, .23], ['Harpalyke', 'Jupiter', 21105000, 2.2, -623.3, 148.6, .23],
    // v10 additions (JPL SSD tables, rounded)
    ['Dia', 'Jupiter', 12118000, 2, 287, 28.2, .21], ['Ersa', 'Jupiter', 11401000, 1.5, 252, 30.6, .09], ['Pandia', 'Jupiter', 11481000, 1.5, 252, 28.2, .18], ['Hermippe', 'Jupiter', 21300000, 2, -634, 150.7, .21],
    ['Thyone', 'Jupiter', 21192000, 2, -627, 148.6, .23], ['Euanthe', 'Jupiter', 20799000, 1.5, -620, 148.9, .23], ['Megaclite', 'Jupiter', 23806000, 2.7, -752, 152.8, .42], ['Taygete', 'Jupiter', 23360000, 2.5, -732, 165.2, .25],
    ['Hati', 'Saturn', 19856000, 3, -1038, 165.8, .37], ['Fornjot', 'Saturn', 25146000, 3, -1494, 170.4, .21],
    // v11 additions (JPL SSD tables, rounded)
    ['Aegaeon', 'Saturn', 167500, 0.33, 0.8081, 0.001, 0], ['Anthe', 'Saturn', 197700, 0.9, 1.0365, 0.02, .001], ['Aegir', 'Saturn', 20735000, 3, -1117.5, 166.7, .25], ['Bergelmir', 'Saturn', 19338000, 3, -1005.9, 158.5, .14],
    ['Bestla', 'Saturn', 20192000, 3.5, -1088, 145.2, .52], ['Farbauti', 'Saturn', 20377000, 2.5, -1086, 156.4, .21], ['Fenrir', 'Saturn', 22454000, 2, -1260, 164.9, .13], ['Greip', 'Saturn', 18206000, 3, -921, 179.8, .33],
    ['Hyrrokkin', 'Saturn', 18437000, 4, -931, 151.5, .33], ['Jarnsaxa', 'Saturn', 18811000, 3, -965, 163.3, .22],
    // v12 additions (JPL SSD tables, rounded)
    ['Francisco', 'Uranus', 4276000, 11, -266.6, 147.5, .14], ['Margaret', 'Uranus', 14345000, 10, 1687, 50.7, .66], ['Ferdinand', 'Uranus', 20901000, 10, -2805, 169.8, .37], ['Trinculo', 'Uranus', 8504000, 9, -749, 167, .22], ['Stephano', 'Uranus', 8004000, 16, -677, 143.6, .23],
    ['Psamathe', 'Neptune', 46695000, 20, -9074, 137.4, .38], ['Laomedeia', 'Neptune', 23571000, 21, 3171, 34.7, .40],
    // v18 additions (JPL SSD tables, rounded)
    ['Tarqeq', 'Saturn', 18009000, 3.5, 887, 46.1, .16], ['Skoll', 'Saturn', 17665000, 3, -878, 161.2, .46], ['Surtur', 'Saturn', 22704000, 3, -1297, 177.5, .45], ['Loge', 'Saturn', 23058000, 3, -1311, 167.9, .19], ['Kari', 'Saturn', 22089000, 3.5, -1231, 156.3, .48],
    ['Kore', 'Jupiter', 24543000, 1, -779, 145, .33], ['Sponde', 'Jupiter', 23487000, 1, -748, 151, .31], ['Arche', 'Jupiter', 22931000, 1.5, -723, 165, .26],
    ['Aitne', 'Jupiter', 23231000, 1.5, -730, 165, .26], ['Eukelade', 'Jupiter', 23661000, 2, -746, 165.5, .27], ['Autonoe', 'Jupiter', 24046000, 2, -761, 152.4, .33],
    // v19 additions (JPL SSD tables / discovery papers, rounded)
    ['Valetudo', 'Jupiter', 18928000, 0.5, 533, 34, .22], ['Eurydome', 'Jupiter', 22865000, 1.5, -717, 150.3, .28], ['Actaea', 'Salacia', 5724, 143, 5.49, 0, .01], ['Ilmarë', 'Varda', 4809, 163, 5.75, 0, .02],
    // v22 additions (JPL SSD tables / DART results, rounded)
    ['Dactyl', 'Ida', 108, 0.7, 1.54, 8, 0], ['Dimorphos', 'Didymos', 1.19, 0.085, 0.4986, 0, 0], ['Mneme', 'Jupiter', 21069000, 1, -620, 148.6, .23], ['Chaldene', 'Jupiter', 23179000, 1.9, -723.7, 165.2, .25], ['Isonoe', 'Jupiter', 23217000, 1.9, -726.2, 165.2, .25], ['Erinome', 'Jupiter', 23196000, 1.6, -728.5, 164.9, .27], ['Kale', 'Jupiter', 23217000, 1, -729.5, 165, .26], ['Kallichore', 'Jupiter', 24043000, 1, -764.7, 165.5, .26], ['Herse', 'Jupiter', 22992000, 1, -734, 164.2, .2], ['Eupheme', 'Jupiter', 20209000, 1, -617, 146, .25],
    ['Thelxinoe', 'Jupiter', 20453000, 1, -597, 151.4, .22], ['Helike', 'Jupiter', 21263000, 2, -634.8, 154.8, .15], ['Orthosie', 'Jupiter', 20720000, 1, -623, 145.9, .28], ['Hegemone', 'Jupiter', 23947000, 1.5, -740, 155.2, .33]
  ],
  // Spacecraft: direction (RA/Dec, J2000) and distance at 2025.0, outbound speed (AU/yr). From NASA/JPL mission status pages; Pioneers untracked (model).
  craft: [
    { name: 'Voyager 1', ra: 257.6, dec: 12.0, d0: 164.0, v: 3.58, launch: '1977', note: 'Crossed heliopause Aug 2012 at 121.6 AU' },
    { name: 'Voyager 2', ra: 300.6, dec: -58.5, d0: 136.8, v: 3.22, launch: '1977', note: 'Crossed heliopause Nov 2018 at 119 AU' },
    { name: 'New Horizons', ra: 288.0, dec: -20.6, d0: 60.5, v: 2.95, launch: '2006', note: 'Pluto flyby 2015, Arrokoth 2019' },
    { name: 'Pioneer 10', ra: 78.0, dec: 26.0, d0: 136.0, v: 2.54, launch: '1972', note: 'Contact lost 2003: model estimate' },
    { name: 'Pioneer 11', ra: 282.0, dec: -8.6, d0: 113.5, v: 2.40, launch: '1973', note: 'Contact lost 1995: model estimate' }
  ],
  // Planet Nine (HYPOTHETICAL). a AU, e, i, Omega, varpi deg
  p9: {
    brief: { label: 'a≈500 AU, e≈0.3 (brief)', a: 500, e: 0.3, i: 16, O: 96, varpi: 247, mass: 6 },
    bb2021: { label: 'Brown & Batygin 2021: a≈380, e≈0.2', a: 380, e: 0.2, i: 16, O: 96, varpi: 247, mass: 6.2 }
  },
  helio: { nose: [255.4, 5.2], ts: 90, hp: 121 },
  // Bright stars [name, RA deg, Dec deg, Vmag] (Yale Bright Star Catalogue values)
  stars: [
    ['Sirius', 101.287, -16.716, -1.46], ['Canopus', 95.988, -52.696, -0.74], ['Rigil Kentaurus', 219.9, -60.834, -0.27], ['Arcturus', 213.915, 19.182, -0.05], ['Vega', 279.235, 38.784, 0.03],
    ['Capella', 79.172, 45.998, 0.08], ['Rigel', 78.634, -8.202, 0.13], ['Procyon', 114.825, 5.225, 0.34], ['Achernar', 24.429, -57.237, 0.46], ['Betelgeuse', 88.793, 7.407, 0.5],
    ['Hadar', 210.956, -60.373, 0.61], ['Altair', 297.696, 8.868, 0.77], ['Acrux', 186.65, -63.099, 0.76], ['Aldebaran', 68.98, 16.509, 0.86], ['Antares', 247.352, -26.432, 0.96],
    ['Spica', 201.298, -11.161, 0.97], ['Pollux', 116.329, 28.026, 1.14], ['Fomalhaut', 344.413, -29.622, 1.16], ['Deneb', 310.358, 45.28, 1.25], ['Mimosa', 191.93, -59.689, 1.25],
    ['Regulus', 152.093, 11.967, 1.35], ['Polaris', 37.95, 89.264, 1.98], ['Alnitak', 85.19, -1.94, 1.77], ['Alnilam', 84.053, -1.202, 1.69], ['Mintaka', 83.002, -0.299, 2.23],
    ['Bellatrix', 81.283, 6.35, 1.64], ['Saiph', 86.939, -9.67, 2.07], ['Dubhe', 165.932, 61.751, 1.79], ['Merak', 165.46, 56.383, 2.37], ['Phecda', 178.458, 53.695, 2.44],
    ['Megrez', 183.857, 57.033, 3.31], ['Alioth', 193.507, 55.96, 1.77], ['Mizar', 200.981, 54.925, 2.27], ['Alkaid', 206.885, 49.313, 1.86], ['Schedar', 10.127, 56.537, 2.24],
    ['Caph', 2.295, 59.15, 2.28], ['Navi', 14.177, 60.717, 2.15], ['Ruchbah', 21.454, 60.235, 2.66], ['Segin', 28.599, 63.67, 3.35]
  ]
};
