# Desert background integration

> Historical daytime integration. The active renderer now uses the approved
> night source and infinite chunks. See [night terrain](night-desert-terrain.md)
> for current assets, scale, validation, screenshots and limitations.

The supplied `assets/maps/desert_background.png` is now the main world-space
environment. Its bytes remain unchanged: 5016 × 2823, 3,242,702 bytes, SHA-256
`23aaa11a15e7f868a863ccc1350fe36cb305eb2b5d77e088ea3c67fb6ac5db1e`.

## World behavior

The image is a finite visual region inside the existing unbounded world, not a
fixed arena or screen overlay. Its top-left is (-2508,-1411), bottom-right
(2508,1412). One source pixel equals one world unit on every screen size. Camera
offsets use the same integer screen alignment as entities. Only the visible
source rectangle is drawn. The image is never stretched to the viewport, tiled,
mirrored or repeated. Image smoothing is disabled.

A 256-world-pixel edge band blends the artwork toward compatible orange sand.
Deterministic procedural sand extends indefinitely beyond it. Boundary blending
uses narrow gradient fills directly on the main canvas: no temporary canvas,
per-frame image creation, or full-world texture copies. Sand details and existing
procedural scenery fade in as the painted image fades out. The opaque image
interior suppresses old procedural cactus/bush decorations to avoid doubling
the scenery already painted into the source.

All gameplay entities render after the background. Painted rocks, cliffs,
buildings and cacti remain traversable decorations; they add no collisions or
world bounds. Player movement, camera following, spawning, combat, bosses,
questions, rewards, Isac, character sprites, No Hit and the 900-second duration
retain their simulation logic. The new module consumes no simulation RNG.

The active `installDetailedSprites()` override previously replaced the ground
with night terrain. That override now selects the new renderer; the older night
renderer remains available as a fallback if the module itself is unavailable.
While the image loads, or if loading/dimensions fail, the module renders fully
filled procedural sand and restores ordinary procedural scenery. Its `status()`
reports loading/ready/error/unavailable for diagnostics.

The image is loaded once using a script-relative URL and content-hash query,
compatible with a GitHub Pages subdirectory and local offline files. The original
PNG is already about 3.1 MiB compressed. No unnecessary resized derivatives were
created. Its decoded RGBA footprint is approximately 54 MiB; lower-memory physical
phones still need device testing.

## Files

Created `js/desert_background.js`, `tools/check_desert_background.cjs`,
`tools/check_desert_browser.cjs`, `tools/desert_browser_checks.cjs`, and this report.
Modified the visual integration points in `js/main.js`, the module reference and
cache revisions in `index.html`, and the test harness module list in
`tools/game_fixture.cjs`. The Isac browser runner now also supports a desert mode
so the local server, isolated Chromium launcher and error checks can be shared.
Production code does not gain a test/debug API; browser instrumentation exists
only in test-server responses.

No simulation functions, approved character artwork, Isac progression code,
question-bank files or background pixels were changed. No assets were deleted.
No commit or push was made.

## Validation

`node tools/check_desert_background.cjs` passes: real PNG header/hash/dimensions,
single image lifecycle, native-size crops, camera offsets, all four edges and
corners, off-map coordinates, complete fallback fill, portrait/landscape viewport
sizes, scenery suppression, zero temporary-canvas allocations over 1000 edge
draws, error/dimension fallback, rendering without game-state mutations, and
300 deterministic simulation frames with identical state/RNG for loaded versus
failed background. Walking beyond world coordinate 100000 remains unrestricted.

`node tools/check_desert_browser.cjs` passes in real Edge. The sandboxed browser
failed to initialize; the successful run used the approved execution path outside
the workspace sandbox, with a separate temporary profile and no disabled browser
sandbox settings. Actual image decoding, center/edge/corner/off-map pixels, no
blank sampled pixels, native-size rendering, foreground enemy/gem/chest pixel
changes, and no JavaScript/network errors passed. Viewports: 1280×800, 360×640,
640×360. Desktop/mobile screenshots were inspected directly.

The latest headless desktop 60-frame samples with 30 enemies and automatic combat
measured approximately 60 FPS at both the center and edge. Median update+draw
cost was 2.3 ms at the center and 2.5 ms at the edge; p95 was 3.1/3.7 ms.
Background-only edge draw median was 2.7 ms at 1280×800 and 0.8 ms at 360×640.
These are short measurements on this machine, not a guarantee for every horde,
GPU or physical mobile device. Detailed values are in
`tools/desert-performance.generated.json`. The initial offscreen compositing
approach was replaced after measurements showed higher boundary cost.

15 additional existing Node commands passed (all under `tools/`, `.cjs`):
`check_isac_shop`, `check_hero_sprites`, `check_sprite_loading`,
`check_weapon_sprites`, `check_elements`, `check_chests`, `check_roster_bosses`,
`check_enemy_sprites`, `check_enemy_png`, `check_enemy_xp`, `check_character_art`,
`check_balance`, `check_enemy_levels`, `check_match_duration`, `check_no_hit`.
The background test makes 16 passing Node commands, plus the browser check.
`check_player_sprite.cjs` was also attempted but cannot compare to `HEAD` because
this extracted workspace lacks Git history. No test was weakened to hide this.

## Evidence and limits

- `tools/desert-1280x800-center.generated.png`
- `tools/desert-1280x800-edge.generated.png`
- `tools/desert-360x640-center.generated.png`
- `tools/desert-360x640-edge.generated.png`
- `tools/desert-640x360-center.generated.png`
- `tools/desert-640x360-edge.generated.png`
- `tools/desert-performance.generated.json`
- `tools/desert-browser.generated.log`

The painted region is more detailed than its sparse procedural extension; the
transition avoids a hard image seam but is not a claim that the source is
seamless. Characters can visually stand over painted cliffs because the artwork
is decorative, as requested. Existing mobile HUD text crowding remains visible
in the screenshots; this update does not alter the HUD layout. Physical-phone
memory/performance and long-session extreme-horde testing remain outside the
short headless benchmark.
