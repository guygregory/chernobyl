# Recorded release evidence

Measured on **30 September 2026**, using the final production build after material batching. This is reference-device evidence, **not** a promise of the same frame rate on every device or browser.

## Reference environment and method

| Property | Recorded value |
| --- | --- |
| OS | Windows 11 Enterprise Insider Preview, 10.0.26220, x64 |
| CPU | Intel Core Ultra 7 165H; 22 logical processors |
| Memory reported by Node | 33,983,225,856 bytes |
| GPU / driver | Intel Arc Graphics / 32.0.101.8425 |
| Browser | Chromium 141.0.7390.37, Playwright 1.56.1 |
| Hardware renderer | `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| Browser viewport | 1920 x 1080 CSS pixels |
| Actual canvas viewport | 1920 x 840 CSS pixels; header/timeline occupy the rest |
| Drawing buffer | 2400 x 1050 pixels, Medium DPR 1.25 |
| Scene / quality | `latest-2026` / Medium; shadows 1024; 210 contextual trees |
| Scene statistics | 52 draw calls, 68,046 triangles; 8 uploaded geometries, 2 textures, 58 scene-graph objects |

`scripts/benchmark.mjs` uses full Chromium's new headless mode and default ANGLE for the hardware run (`--enable-gpu --ignore-gpu-blocklist`). It verifies the **actual** renderer string rather than equating a requested hardware path with hardware. SwiftShader, software/llvmpipe/basic render drivers and unidentified renderer strings are not accepted as hardware proof.

Each run warms up eight orbit frames, then records real React Three Fiber render-loop frame intervals during eight seconds of camera orbit. Three runs are made sequentially without simultaneous builds or browser test jobs. The camera is restored afterward; the historical milestone never changes. The machine is a shared, non-dedicated desktop, so scheduling variation remains possible.

## Orbit measurements

Hardware report timestamp: **2026-09-30T01:18:41.879Z**.

| Intel Arc run | Measured duration | Frames | Average FPS | Median frame | P95 frame |
| --- | --- | --- | --- | --- | --- |
| 1 | 8.0007 s | 404 | 50.50 | 16.8 ms | 30.4 ms |
| 2 | 8.0155 s | 481 | 60.01 | 16.7 ms | 17.1 ms |
| 3 | 8.0003 s | 461 | 57.62 | 16.7 ms | 23.5 ms |

**Desktop target met:** all three actual hardware runs exceed the 30 FPS target at the recorded 1920 x 1080 browser size and Medium preset. This is not an inference from mocked WebGL or a software-rendered test.

A **separate** deterministic CI/software comparison used Chromium's headless shell with `--use-angle=swiftshader --enable-unsafe-swiftshader`. Its actual renderer was:

`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`

Software report timestamp: **2026-09-30T01:19:21.726Z**.

| SwiftShader run | Measured duration | Frames | Average FPS | Median frame | P95 frame |
| --- | --- | --- | --- | --- | --- |
| 1 | 8.0290 s | 19 | 2.37 | 438.6 ms | 1065.9 ms |
| 2 | 8.4182 s | 20 | 2.38 | 416.9 ms | 791.5 ms |
| 3 | 8.2865 s | 21 | 2.53 | 398.6 ms | 717.9 ms |

**Remaining limitation:** CPU-only SwiftShader is not smooth at this resolution/preset and does **not** meet 30 FPS. It remains useful for real-renderer correctness and screenshot tests, but is not substituted for GPU acceptance evidence. Low quality offers lower DPR, no shadows and fewer contextual details; no unmeasured CPU/mobile frame-rate guarantee is made. The accessible history works without WebGL.

## Batching, detail and memory

The profiler revealed 1,167 draw calls before optimization, mostly because every NSC cladding quad had its own material group. The final implementation keeps precisely the same triangles and panel material assignments but groups them into **five** cladding draws and **one** patch draw. The complete scene now uses **52** draws. The triangle count remains **68,046**.

Regression tests compare the complete Float32 triangle/material multiset with the original unbatched construction for full, damaged and patched surfaces at Low/Medium/High detail (nine combinations). They also require five full/breached groups, one patch group and fewer than 100 complete-scene draws in the real browser. Final latest, intact-1986, original-Shelter and mobile screenshots were re-inspected; no fidelity or visual redesign accompanied batching.

This reduces submission overhead, but it did not materially improve the measured software frame rate; the remaining software bottleneck was not further isolated. **No software FPS improvement is claimed.** Instancing, shared geometry/materials, demand rendering when idle, cached shadows between historical changes and resource disposal are also retained.

The real-browser memory test performs three cycles over six substantially different milestones (18 switches), returning to the same final scene. Uploaded geometry, texture and scene-object counts remain within explicit bounds of baseline +8 geometries, +1 texture and +5 objects. Replaced NSC resources are disposed; shutdown snapshots retain their buildings rather than creating extra copies.

## Initial-transfer budget

`npm run measure:assets` compresses every shipped file individually. The conservative total includes the lazy 3D bundle and all quality code; there are **no optional model/texture downloads**.

| Budget measure | Bytes |
| --- | --- |
| All files, uncompressed | 1,181,671 |
| All files, gzip | **334,716** |
| All files, Brotli | **279,885** |
| Actual initial HTTP responses, hardware browser/CDP | **337,932** |
| Actual initial HTTP responses, software browser/CDP | **337,805** |
| Agreed compressed budget | 15,000,000 |

**Transfer target met.** Actual Vite-preview response headers confirmed gzip for HTML, JavaScript and CSS, with identity encoding for the small SVG/manifest. CDP totals include response overhead and, in the hardware run, an extra favicon validation request. These actual network measurements are distinct from estimated or individually compressed build totals.

Final shipped files:

| File | Raw bytes | Gzip bytes |
| --- | --- | --- |
| `index.html` | 2,619 | 1,267 |
| `site-manifest.json` | 308 | 228 |
| `assets/atlas-mark.svg` | 324 | 220 |
| `assets/index-B1vKq3HN.css` | 22,281 | 6,003 |
| `assets/index-B2Z04USB.js` | 235,705 | 74,263 |
| `assets/PlantScene-DiE15uX_.js` | 51,540 | 18,436 |
| `assets/react-core-BkkLQXgL.js` | 164,835 | 52,885 |
| `assets/three-core-WCoUc2Ni.js` | 704,059 | 181,414 |

## Final acceptance checks

| Command / evidence | Result |
| --- | --- |
| `npm run build` | Pass: source/manifest validation, strict TypeScript and actual Vite production build |
| `npm run lint` | Pass |
| `npm test` | **24 passed** in 3 files |
| `npm run test:browser` | **13 passed**, actual WebGL, not a mocked canvas |
| `npm run verify:basepath` | Pass: actual `/chernobyl/` production build, all 8 requested assets and hash navigation, no routing rewrites/external assets |
| `npm run measure:assets` | Pass: full compressed build below 15 MB |
| Hardware orbit benchmark | Pass: actual Intel Arc / D3D11, 50.50-60.01 FPS averages |
| Desktop and 390 x 844 screenshots | Inspected after final batching |

Browser coverage includes every milestone in arbitrary order, synchronized immutable state, camera preservation, focus/reset/zoom/keyboard controls, valid and invalid deep links, the skip-link regression, absent-at-date landmark messaging, unsupported WebGL, manifest failure/retry, interrupted 3D-module failure/reload, actual `WEBGL_lose_context`, real CDP touch drag/pinch and touch controls, reduced motion, actual narrow canvas/ancestor dimensions, bounded memory, and computed small-label/source-metadata contrast of at least 4.5:1.

Raw release summaries are saved in [performance-results.json](performance-results.json). Full resource-level reports and screenshots were captured in the session's persistent artifacts:

```text
C:\Users\gugregor\.copilot\session-state\29f7fe72-953e-44a3-b5ef-c6e7a8643815\files\performance\performance-hardware.json
C:\Users\gugregor\.copilot\session-state\29f7fe72-953e-44a3-b5ef-c6e7a8643815\files\performance\performance-software.json
C:\Users\gugregor\.copilot\session-state\29f7fe72-953e-44a3-b5ef-c6e7a8643815\files\asset-budget.json
C:\Users\gugregor\.copilot\session-state\29f7fe72-953e-44a3-b5ef-c6e7a8643815\files\screenshots\
```

Images include `desktop-latest.png`, `desktop-1986-before.png`, `desktop-1986-shelter.png`, `mobile-latest.png`, `mobile-field-notes.png`, `mobile-touch.png` and `no-webgl-history.png`.

The fidelity limitation remains intentional: original, historically informed **approximate exterior geometry**, not a survey-grade/photorealistic twin or live site state. Latest depicted state is **15 September 2026**, source publication **16 September 2026**, review **30 September 2026**. No completed 2026 NSC restoration is asserted.
