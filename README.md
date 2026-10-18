# 🪐 Solar System Atlas

**A live, interactive 3D model of the whole Solar System, with every planet where it really is right now.**

Fly from the Sun's surface out to the edge of the Oort Cloud (~100,000 AU), watch the planets, moons and comets move on their real orbits, jump to any date from 1000 to 3000 AD, or take the controls of a UFO and scan the system yourself.

Built with [three.js](https://threejs.org) and real orbital data from [NASA JPL](https://ssd.jpl.nasa.gov/planets/approx_pos.html).

---

## ✨ What's inside

- **Real, live positions.** Planets are solved every frame from JPL's approximate Keplerian elements (Standish, with secular rates) using Kepler's equation. Comets, including hyperbolic paths, use their published elements. Earth's Moon uses Meeus mean elements.
- **Time machine.** Pause, real time, reverse, speed up to a year per second, jump to any date, or snap back to *now*.
- **The Sun and 8 planets.** Real radii, axial tilts, rotation and orbit geometry, procedural shader surfaces, Earth's clouds, night lights and aurora, live seasons, and Saturn's rings with the Cassini division.
- **Moons** of every planet, grouped and filterable.
- **Dwarf planets and TNOs.** Ceres, Pluto, Haumea, Makemake, Eris, Sedna, Quaoar, Orcus, 2012 VP113 and more.
- **Small bodies.** The main asteroid belt with Kirkwood gaps, Trojans, Hildas, Centaurs and the Kuiper Belt (classical, plutinos and scattered disk).
- **Famous rocks and comets.** Apophis, Bennu, Psyche, Vesta, 2024 YR4, Halley, Hale-Bopp and Encke. The comets grow tails that point away from the Sun.
- **The edge of the map.** The termination shock and heliopause bubble, Voyager 1 and 2, Pioneer 10 and 11, and the Oort Cloud.
- **Planet Nine (hypothetical).** A dashed orbit from the Batygin–Brown estimate, clearly marked as unconfirmed.
- **The night sky.** Bright stars placed by RA/Dec and magnitude, plus the Milky Way.
- **🛸 UFO mode.** Fly a third-person saucer through the system, glide to any body, orbit it, and scan it into the info card.

## 🚀 Run it

No build step. It's a static site, but `index.html` loads its scripts as modules, so serve it rather than double-clicking:

```bash
git clone https://github.com/ChrisJDiMarco/solar-system-atlas.git
cd solar-system-atlas
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works: `npx serve`, VS Code Live Server or GitHub Pages. The first load needs the internet to fetch three.js from jsDelivr.

## 🎮 Controls

**Look around**
- Drag to orbit, scroll or pinch to zoom, click any body to fly to it and follow it.
- `/` search · `H` Sun · `E` Earth · `T` planet tour, Mercury to Pluto (press again to stop) · `?` lists every key · `Esc` closes the info card

**Time**
- `Space` pause or play · `R` real time · `N` now · `\` reverse
- `[` slower · `]` faster · `.` / `,` step a day forward or back · `>` / `<` a month · `y` / `Y` a year forward or back

**Layers**
- `L` labels · `O` orbits · `M` moons · `B` belts · `C` comets · `K` Kuiper Belt
- `X` Oort Cloud · `U` heliosphere · `P` Planet Nine · `V` spacecraft · `G` stars

**UFO mode** (press **Fly UFO**)
- `WASD` fly · `E` / `Q` up and down · `Shift` boost · drag to look
- `F` scan · `G` go to · `T` orbit · `Esc` park & exit. Where you park is saved, so Fly UFO picks up there.

The drawer (☰) has Layers (with saved views), Tonight, Moons and About tabs.

## 🗂 Files

| File | What it does |
|---|---|
| `index.html` | The whole Atlas: orbital data, ephemeris maths, shaders, scene, interface |
| `ufo.css` | Styling for UFO mode |
| `js/ship.js` | The UFO's saucer model and its effects |
| `js/views.js` | Saved views: bookmarks of the camera, date and layers |
| `js/ufo.js` | UFO mode: flying, scanning, go to and orbit |
| `LICENSE` | MIT |

## 🔭 About the accuracy

- **Real:** orbit geometry and planet positions, computed from published elements. Planet accuracy is best between 1800 and 2050.
- **Representative:** asteroid and Kuiper Belt particles are seeded distributions, not catalogues.
- **Approximate:** planet surface features are hand-placed, and spacecraft positions are extrapolated from their direction and speed.
- **Hypothetical:** Planet Nine. It's marked as such everywhere it appears.

## 📝 Notes

Built as a [Thinklet](https://thinklet.io) (a small AI-built app). Inside Thinklet the Atlas remembers your camera, time and layers. As a plain web page those settings aren't kept between visits.

## 📜 License

MIT. See [LICENSE](LICENSE).
