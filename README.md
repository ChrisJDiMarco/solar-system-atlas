# Solar System Atlas

A live, interactive three.js model of the whole Solar System, from the Sun's surface out to the edge of the Oort Cloud (~100,000 AU). Every planet sits where it really is right now.

Built as a Thinklet (a small AI-built app) and exported as a plain static web page.

## Features

- **Real, live positions.** Planets use JPL's approximate Keplerian elements with secular rates (Standish), solved with Kepler's equation every frame. Comets and small bodies use their published orbital elements (hyperbolic paths too, like 3I/ATLAS). Earth's Moon uses Meeus mean elements.
- **Time control.** Pause, real time, reverse, speed up to 1 year per second, jump to any date from 1000 to 3000 AD, and back to now. (Planet accuracy is best between 1800 and 2050.)
- **The Sun and 8 planets** with real radii, axial tilts, rotation and orbit geometry, procedural shader surfaces, Earth's clouds, night lights and aurora, live seasons, and Saturn's rings with the Cassini division and its true ring tilt. Faint rings of Jupiter, Uranus and Neptune, plus Saturn's E and Phoebe rings.
- **Moons** grouped and filterable by planet, tidally locked where they should be.
- **Dwarf planets and TNOs:** Ceres, Pluto, Haumea, Makemake, Eris, Sedna, Quaoar, Orcus, Gonggong-class objects, 2012 VP113, Leleākūhonua and more.
- **Small-body populations:** main belt with Kirkwood gaps, Hildas, Hungarias, Jupiter, Mars and Neptune Trojans, near-Earth sample, Centaurs, zodiacal dust, Kuiper belt (classical, plutinos, scattered disk).
- **Notable asteroids and comets:** Apophis, Bennu, Psyche, Vesta, 2024 YR4, Halley, Hale-Bopp, Encke and others, with dust and ion tails pointing away from the Sun.
- **Heliosphere and spacecraft:** termination shock and heliopause bubble, Voyager 1 and 2, Pioneer 10 and 11.
- **Oort Cloud:** inner Hills cloud and outer shell.
- **Planet Nine (HYPOTHETICAL):** a dashed orbit from the Batygin–Brown estimate, clearly marked as unconfirmed.
- **Sky:** bright stars placed by RA/Dec and magnitude, plus the Milky Way band.
- Lagrange point markers, a solar-system barycentre, a Tonight tab, search, layer toggles, true or visible size scale, and log or linear distance.

## Run it

It's a static site with no build step. Because `main.js` is an ES module, open it through a local server rather than double-clicking `index.html`:

```bash
git clone https://github.com/ChrisJDiMarco/solar-system-atlas.git
cd solar-system-atlas
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (`npx serve`, VS Code Live Server, GitHub Pages). It needs an internet connection the first time to load three.js from a CDN.

### Controls

- Drag to orbit, scroll or pinch to zoom, click a body to fly to it and follow it.
- Space: pause or play. Keyboard shortcuts toggle layers (M moons, O orbits, and more).
- ☰ opens Layers, Tonight, Moons and About.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout and script order |
| `style.css` | Interface styling |
| `js/data.js` | Orbital elements and physical data for planets, moons, small bodies, spacecraft and stars |
| `js/ephem.js` | Ephemeris math: Kepler solvers, Standish elements, coordinate transforms, light-time |
| `js/state.js` | Saved settings and time/camera actions |
| `js/shaders.js` | GLSL for planets, the Sun, rings and glows (log depth buffer) |
| `js/belts.js` | Particle populations, Oort Cloud, heliosphere bubble and sky |
| `js/ui.js` | Info card, drawer, search, time bar and labels |
| `js/main.js` | three.js scene, camera, render loop and picking |

## Notes on accuracy

Orbit geometry and positions are computed from real elements. Particle belts are representative seeded distributions, not catalogues. Planet surface features are hand-placed approximations. Spacecraft positions are extrapolated from their direction and speed. Planet Nine is hypothetical.

Inside Thinklet the Atlas saves its camera, time and layers; as a plain web page those settings simply aren't kept between visits.

## License

MIT. See [LICENSE](LICENSE).
