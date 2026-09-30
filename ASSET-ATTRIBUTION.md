# Assets, reference data and attribution

No external 3D models, photographs, satellite images, HDR environments, map tiles, textures, fonts or purchased assets are embedded or loaded at runtime.

## Original work in this repository

| Asset | Location | Origin / license |
| --- | --- | --- |
| Reactor blocks, turbine halls, Shelter, stacks, contextual campus structures | `src/scene/structures/siteModel.ts` | Original procedural exterior geometry authored for this project; MIT |
| NSC shell, ribs, end walls, indicative breach and patch | `src/scene/structures/archGeometry.ts`, `Nsc.tsx` | Original math/geometry; nominal overall dimensions from public ChNPP/EBRD records; MIT |
| Terrain, banks, water, approximate roads/rail, trees and original material palette | `siteModel.ts`, `src/scene/resources.ts` | Original seeded procedural geometry and generated grain texture; MIT |
| Atlas mark / favicon | `public/assets/atlas-mark.svg` | Original SVG authored for this project; MIT |
| UI icons | `src/components/Icon.tsx` | Original inline SVG paths; MIT |
| Historical narrative and editorial notes | `src/data/`, `index.html` | Original summaries of cited factual records; MIT |

These are **not** authentic survey, engineering or photogrammetry assets. Public photographs were used only as visual references to create generalized original envelopes. No reference image or protected engineering drawing is redistributed. Cladding seams, windows, construction frames, the accident envelope and the 2025 breach/patch are interpretive details, not verified measurements.

## Reused geographic reference data

**Copyright OpenStreetMap contributors.** Selected public geographic anchors were read on 30 September 2026 via the Overpass API and used in `src/data/landmarks.ts`. The coordinate-reference portion derived from OSM is licensed under the **Open Data Commons Open Database License 1.0 (ODbL)**, not the software MIT license.

Reference features:

| Feature | OpenStreetMap identifier |
| --- | --- |
| Reactor Unit 3 | [way 326145079](https://www.openstreetmap.org/way/326145079) |
| Reactor Unit 4 | [way 500551950](https://www.openstreetmap.org/way/500551950) |
| Original Shelter | [way 500551951](https://www.openstreetmap.org/way/500551951) |
| New Safe Confinement | [way 456732992](https://www.openstreetmap.org/way/456732992) |
| ABK-1 administration | [way 225922562](https://www.openstreetmap.org/way/225922562) |

Unit 1/2 approximate geographic anchors are corroborated by the public [GEM unit-level location table](https://www.gem.wiki/Chernobyl_nuclear_power_plant). Roads, rail, water and contextual building footprints are original generalized shapes rather than copies of the OSM dataset.

Attribution is displayed beside the map and in the Sources panel. Preserve it when distributing the rendered produced work. If publishing a modified derived geographic database, comply with ODbL attribution and share-alike requirements. The separately authored application, narrative and mesh-generation code do not become ODbL software.

- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright)
- [ODbL 1.0 text](https://opendatacommons.org/licenses/odbl/1-0/)

## Historical references are not embedded assets

Primary ChNPP and EBRD reports, the accessible GEM/PRIS transcription and World Nuclear News are cited with actual URLs, publication precision, review information and uncertainty in `src/data/sources.ts`. Public visibility of a photograph or map is **not** permission to redistribute it. This app links to the original records without copying their media.

React, Vite, Three.js, React Three Fiber, Drei and validation tools retain their respective package licenses. Their exact versions and transitive dependencies are recorded in `package-lock.json`. No packages are represented as historically authentic site models.
