# Chernobyl Atlas

A standalone, source-reviewed historical 3D reconstruction of the Chornobyl nuclear power plant campus. Seventeen **manual** milestones span the main-building foundation in 1972 to the latest verified account in September 2026. Original exterior geometry is rendered with React Three Fiber / Three.js; semantic HTML provides the same history without WebGL.

**Latest depicted state: 15 September 2026.** The latest primary source was published on **16 September 2026**, and this edition was reviewed on **30 September 2026**. The outer-cladding opening was reported closed in October 2025; full NSC functional restoration is **not** claimed complete. This is not live telemetry, a survey, a safety model or a site-access guide.

## Run locally

Node.js **22.12 or newer** is required; this edition was built with Node 24.18.1 and npm 11.16.0. Exact package versions and `package-lock.json` are committed.

```powershell
npm ci
npm run dev
```

The development server binds to `127.0.0.1`. For the actual production app:

```powershell
npm run build
npm run preview -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/`. If that port is occupied, choose another explicit port. No accounts, keys, backend, database, connectors, remote tiles, fonts or model downloads are needed.

## Controls and accessibility

Drag to orbit; right-drag or two fingers to pan; scroll or pinch to zoom. The map provides reset, zoom, north-oriented view, quality and label controls. Selecting a landmark highlights it without moving the camera; **Focus** is an explicit action. Date changes do not reposition the camera or animate undocumented construction transitions.

Keyboard users can skip directly to the milestone picker without changing the historical deep link. Tab to the map: arrows pan, Shift + arrows orbit, `+` / `-` zoom, and Home resets. The timeline, service records, landmark descriptions and all sources are ordinary semantic HTML. Field notes collapse into a sheet on narrow screens. Reduced-motion preferences disable camera damping and UI transitions.

If WebGL 2 is unavailable, a local asset fails, the renderer fails to start or the GPU context is lost, the history remains readable and the error is explicit. **Retry 3D view** reloads the geometry manifest or restarts the renderer; an interrupted module download requires a page reload, retaining its historical hash.

## Static deployment

Upload only the contents of `dist/` to any static HTTP host. Do **not** open `index.html` through `file://`. The default build uses relative asset paths (`base: './'`). No server-side routing or history rewrites are required: deep links are hashes, for example:

```text
#milestone=1986-shelter&landmark=shelter
#milestone=2016-nsc-position&landmark=nsc
```

Query links (`?milestone=1986-before`) are also accepted. Unknown IDs, unknown parameters and repeated parameters produce a visible alert rather than a silent selection. Navigation writes a canonical hash. A selected landmark may be absent in an early state; its notes explicitly say so.

For a known subdirectory, build with an explicit base:

```powershell
$env:APP_BASE_PATH = '/chernobyl/'
npm run build
Remove-Item Env:APP_BASE_PATH
```

Serve that build at `/chernobyl/`; keep the manifest and `assets/` at that same base. The app has no service worker. Normal static-host gzip/Brotli compression is recommended; see the measured asset and renderer evidence in [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## Architecture and geography

| Surface | Responsibility |
| --- | --- |
| `src/data/milestones.ts` | Curated events, date precision, narrative, evidence and uncertainty |
| `src/data/sources.ts` | Actual source URLs, publication precision, review dates and editorial caveats |
| `src/data/landmarks.ts` | Stable landmark IDs, original envelopes and geographic anchors |
| `src/state/resolveSiteState.ts` | Pure, complete, deeply frozen site snapshots; no cumulative mutation |
| `src/state/selection.ts` | Validated deep links and bounded previous/next navigation |
| `src/scene/structures/` | Original instanced industrial geometry and independent curved NSC meshes |
| `src/scene/resources.ts` | Shared geometry/materials, original texture and quality presets |
| `src/scene/PlantScene.tsx` | Bounded camera, lighting, picking, context loss and optional diagnostics |
| `src/components/` | Accessible timeline, history, sources, controls and recovery |
| `public/site-manifest.json` | Validated local edition/origin/asset contract |

The local frame has WGS84 origin **51.3893 N, 30.0992 E**. One scene unit is one metre. X points east, Y is relative height, and Z points south (negative Z is north). A short-distance equirectangular conversion uses 111,320 metres per degree and the cosine of the origin latitude for longitude. It is **not** a survey projection or an elevation datum.

The bounded terrain extends X **-430 to 900 m**, Z **-410 to 460 m**: approximately **1.33 by 0.87 km**. Public OpenStreetMap anchors establish relative positions; the NSC's published 257 m span, 108 m height and 162 m length are used nominally. Other dimensions, terrain, facades, water, routes and vegetation are approximate original reconstruction. The north control resets orientation; the metric-frame graphic is not a perspective measurement tool.

Only the four-unit campus and immediate water/landscape context are included. Pripyat, Chornobyl town, Units 5/6, the wider zone and the full cooling pond are outside the scene. There are no hyperboloid cooling towers, reactor interiors, explosions, radiation overlays or speculative new infrastructure.

## Historical editorial maintenance

1. **Read actual primary records**, not search summaries. Prefer the plant operator, IAEA and EBRD. Record the publication date separately from the date of the event or state depicted. An undated page stays undated; a month/year claim never acquires an invented day.
2. Update or add a record in `sources.ts`, including its URL, publisher, what it supports, review date and uncertainty. The accessible GEM reactor table is explicitly identified as a secondary PRIS transcription: legacy primary links currently redirect. The official construction page's introductory 1971 typo is noted rather than repeated.
3. Add a curated milestone only when useful and evidenced. Keep grid connection distinct from commercial operation, cessation of generation from formal closure decisions, and 2016 NSC placement from 2019 handover. Preserve stable historical IDs; do not silently repurpose a dated record.
4. Add a **complete** resolver specification. Existence, construction, appearance and operating status are separate. Never turn shutdown into demolition, remove the original Shelter when adding the NSC, or depict Unit 4 generating after the accident. Partial arch construction and damage markers must remain explicitly schematic.
5. Update the latest-state pointer, narrative, source/review dates and `site-manifest.json` together. A new dated source does not automatically justify new geometry. Verify any proposed repair or infrastructure change before depicting it, and update affected invariants only with evidence.
6. Run data, state, geometry and browser checks; inspect desktop and mobile images. Re-measure performance if detail or assets change. Future maintenance is manual; the app does not fetch live news or synthesize future years.

The latest source is [ChNPP's 16 September 2026 report](https://chnpp.gov.ua/en/infocenter/news/6627-the-iaea-will-assist-with-the-restoration-of-the-new-safe-confinement-which-was-damaged-by-a-russian-drone-in-february-2025). October 2025 exterior closure and remaining sealing work are described in the [8 December 2025 assessment](https://chnpp.gov.ua/en/infocenter/news/6486-iaea-mission-documented-consequences-of-russian-drone-attack-on-nsc-arch-in-february). The [1 April 2026 EBRD programme](https://www.ebrd.com/home/news-and-events/news/2026/ebrd-donors-back-plan-to-repair-chornobyl-s-protective-shield.html) concerns early engineering/procurement, **not completed restoration**.

## Verification and performance

```powershell
npm run validate:data
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run verify:basepath
npm run measure:assets
```

The browser suite uses actual WebGL with deterministic SwiftShader in CI, not a mocked renderer. It checks all dates in arbitrary order, independent enclosures, camera preservation, controls, deep-link errors, keyboard navigation, skip-link stability, manifest and renderer-module failure/retry, actual `WEBGL_lose_context`, small-label contrast, real touch drag/pinch, narrow framing and bounded graphics memory. The separate base-path verification builds into an ignored test directory and serves a real `/chernobyl/` production app without routing rewrites; it does not interrupt the normal preview.

Separate recorded benchmarks use the production build, a **1920 x 1080 browser viewport**, **Medium** quality and three eight-second orbit runs:

```powershell
node scripts/benchmark.mjs --renderer=hardware
node scripts/benchmark.mjs --renderer=software
```

The hardware run uses full Chromium's default ANGLE path and records the actual renderer; it is not counted as hardware if the browser falls back to SwiftShader. Results include draw calls, triangles, frame percentiles, drawing-buffer dimensions, device/browser metadata and actual local HTTP response bytes. `REPORT_DIR`, `PREVIEW_URL`, `SCREENSHOT_DIR` and `ASSET_REPORT_PATH` can direct verification artifacts without committing test output. Add `?diagnostics=1` to expose the local read-only scene inspector and its explicit orbit benchmark; normal production views do not expose it.

Low/Medium/High adjust DPR (1 / 1.25 / 1.75), shadows (off / 1024 / 2048), vegetation and facade detail. They never change historical presence or published NSC dimensions. Rendering is demand-driven when idle. Shared resources and replaced NSC geometries are disposed.

See [ASSET-ATTRIBUTION.md](ASSET-ATTRIBUTION.md) for original assets, geographic data attribution and license boundaries. Performance evidence reports measured environments, not a universal frame-rate promise.
