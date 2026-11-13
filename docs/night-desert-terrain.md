# Night desert terrain overhaul

## Approved source and scale

The attached `Arena Desértica Pixelada sob a Lua.webp` is **1672 × 941**.
`assets/maps/desert_night.png` is a lossless PNG conversion of its decoded
pixels, with no resize, filtering, recoloring or drawing over the original.
The browser conversion compared every decoded RGBA channel before and after
the PNG round trip and reported equality. PNG SHA-256:
`347cf8b1eee571cce9421141b3e45bd302d7c84ae594262b476666f4da49caa0`.
The supplied WebP remains untouched in Downloads. The PNG is 2,511,113 bytes.

Eight native-size 192 × 192 ground crops were inspected directly in
`tools/night-ground-candidates.generated.png`. Their source origins are
(256,128), (512,128), (768,128), (1024,64), (256,352), (640,352), (896,448),
and (1152,320). They contain sand/cracked-ground textures and exclude the
corner cacti and large decorative objects. No new tile PNGs or AI artwork
were generated. The source image is not assumed to be seamless.

**Scale is 1 source pixel : 1 world pixel : 1 Canvas backing pixel.** Chunk
and visible-source rectangles use integer coordinates and equal source/
destination dimensions. `imageSmoothingEnabled` is false on source extraction,
chunk creation and final rendering. No blur, filters, resizing, per-channel color
blending, full-screen purple overlay or day/night recoloring is applied.

## Infinite chunks and transitions

`js/desert_background.js` now creates an infinite deterministic night terrain,
replacing the previous finite daytime-image region and orange extension.
The game never draws the complete illustration behind the player.

Ground samples overlap on a 128-world-pixel grid. Each sample has a 32-pixel
margin. In the overlap, a world-coordinate hash selects whole 4 × 4 pixel
blocks from neighboring source samples; it does not interpolate their colors.
This breaks straight sample boundaries while retaining crisp original pixels.
Different seeds select among the eight samples. The seed is fixed; terrain
does not consume `Math.random()` or the game's simulation RNG.

The same global pixel-selection function builds every **256 × 256 chunk**.
This is independent of chunk boundaries, camera direction or cache history.
Returning after cache eviction reconstructs identical pixels. Negative and
distant coordinates use the same rules; there are no map walls or finite
arena bounds. Opaque underfill guarantees that pending chunks never produce
black borders or transparent holes.

Existing small night bushes/cacti remain separate decorations, at one quarter
of their previous candidate density. Their sizes are unchanged and the sampled
ground contains no matching large props to duplicate. The original game's
small night rocks/grass palette remains compatible. No painted object is made
into a collision obstacle. No artificial lantern/fire light is added where the
source contains no such light source.

## Performance and loading

- The PNG is loaded once. Source pixels are read only once at load time into
  eight small RGBA sample buffers (about 1.125 MiB total).
- Chunks are cached with least-recently-used eviction, capped at 64 chunks:
  **16 MiB** of RGBA chunk storage. Evicted canvases are resized to zero.
- A normal frame draws only visible chunk portions. A warm view creates no
  canvases, performs no pixel reads and generates no textures.
- Idle callbacks prewarm the starting region. Cold travel builds at most two
  missing chunks per draw; it prioritizes the center and fills all pending
  regions with compatible opaque night sand. This bounds cold-frame work.
- Per-pixel source selection happens only when constructing a missing chunk,
  not for cached chunks or every moving-world pixel each frame.
- Missing/invalid/undecodable sources use deterministic procedural night sand,
  with no texture-canvas allocations. No unrelated gameplay fallback is changed.
- URLs remain script-relative and hash-versioned for GitHub Pages subdirectories
  and local offline files. No new library or network service is required.

Decoded image memory is approximately 6 MiB in addition to the sample bank and
bounded cache, substantially below the former full-resolution day image.
These are RGBA estimates, not a guarantee of a particular browser's GPU overhead.

## Files created and modified

Created:

- `assets/maps/desert_night.png` — unchanged decoded approved artwork.
- `tools/prepare_night_terrain.cjs`, `tools/prepare_night_pixels.cjs` — isolated
  browser WebP-to-PNG conversion, exact decoded-pixel comparison, and crop preview.
- `tools/night-source.generated.json` — source hashes, dimensions and crop origins.
- `tools/night-ground-candidates.generated.png` — inspected native-size crop sheet.
- `docs/night-desert-terrain.md` — this report.
- Six `tools/night-terrain-*.generated.png` browser captures and
  `tools/night-terrain-performance.generated.json` — current evidence.

Modified:

- `js/desert_background.js` — replaces finite daytime rendering with the chunk
  renderer while preserving the component interface used by `js/main.js`.
- `index.html` — renderer cache revision refreshed.
- `tools/check_desert_background.cjs` — tests the new infinite chunk contract,
  exact source pixels, coverage, determinism, cache and simulation equivalence.
- `tools/desert_browser_checks.cjs` — night screenshots, world-pixel scroll
  equality and 120-enemy benchmark.
- `tools/check_isac_browser.cjs` — shared isolated browser launcher supports the
  source-conversion mode and reports the night-terrain checks.
- `README.md`, `docs/desert-background.md` — current report links/history notice.

`js/main.js` was not changed by this overhaul. Character movement, combat,
weapons, enemies, bosses, Knowledge Chest questions, Isac's shop, permanent
upgrades, No Hit and match duration were not edited. Approved character sprites
and their atlases remain untouched. The previous day source is retained as
historical approved artwork but has no active renderer reference. No commit/push.

## Validation results

**16 Node checks passed:** the new terrain check and these existing commands
(under `tools/`, `.cjs`): `check_isac_shop`, `check_hero_sprites`,
`check_sprite_loading`, `check_weapon_sprites`, `check_elements`, `check_chests`,
`check_roster_bosses`, `check_enemy_sprites`, `check_enemy_png`, `check_enemy_xp`,
`check_character_art`, `check_balance`, `check_enemy_levels`,
`check_match_duration`, `check_no_hit`.

The terrain test uses the actual decoded PNG pixels, checks that output colors
come directly from inspected source crops, and exhaustively checks screen
coverage for gaps/overlap at five viewport sizes. It validates global samples
on both sides of chunk boundaries, negative/far coordinates, deterministic
eviction/rebuild, the 16 MiB limit, 500 allocation-free warm draws, fallback
behavior, and 300 real-game frames of identical simulation/RNG with the asset
loaded versus failed. The original roster no-allocation assertion remains intact
and passes after fixing the loading/failure path, rather than weakening the test.

`check_player_sprite.cjs` was attempted and still cannot compare to `HEAD`:
this extracted workspace has no Git history. This is the remaining blocked test.

**Real Edge browser check passed** via the approved isolated execution path,
without disabling browser security. Viewports: 1280 × 800, 360 × 640 and
640 × 360. The image decoded, samples across camera moves retained identical
world pixels, distant/negative coordinates stayed opaque, and real enemies,
gems and chests rendered above the ground. No JavaScript or network errors were
reported. Desktop and mobile screenshots were viewed directly; no straight
chunk borders, blank areas or oversized scenery were seen in the inspected views.

The latest 60-frame desktop samples with **120 enemies and automatic combat**
measured about **60 FPS** at both the origin and a chunk boundary. Median
update+draw was about 1 ms and p95 about 1.9–2.1 ms. Background-only p95 was
at most about 1.2 ms across the sampled cases. These are short headless samples
on this machine, not physical-phone or long-session extreme-horde measurements.

## Remaining visual limits

The source is not a seamless tile. The overlap synthesis avoids whole-image
borders, but the eight original texture motifs are reused, and fine stippling
can be noticed at sample transitions when zoomed in. It is not a claim that
every possible location has undergone visual inspection.

Very large camera jumps may briefly show plain compatible sand while the bounded
cache warms. Ordinary movement reuses cached chunks. Physical low-memory phone
testing and longer horde runs remain useful. Existing mobile HUD text crowding
is visible in captures and was not part of this terrain-only change.
