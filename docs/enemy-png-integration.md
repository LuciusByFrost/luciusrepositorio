# Enemy PNG integration

The root `index.html` loads `assets/enemy_atlas.js` before `js/enemy_sprites.js`.
The historical `luciusrepositorio/index.html` redirects to that entry, including
when opened with `file://`. No fetch, server, or dependency installation is needed.

## Exact mapping

Each directory below contains the supplied `spritesheet.png`, `walk.png`,
`attack.png`, and `atlas.json`, plus the generated runtime `normalized.png`.
`spritesheet.png` supplies both animations; the runtime loads its normalized
derivative once, rather than loading three redundant source images.

| Existing ID | Source directory | Runtime image |
| --- | --- | --- |
| bandit | assets/enemies/coyote_marauder | normalized.png |
| runner | assets/enemies/vulture_scout | normalized.png |
| gunslinger | assets/enemies/dust_bandit | normalized.png |
| brute | assets/enemies/scorpion_brute | normalized.png |
| gravedigger | assets/enemies/cactus_spitter | normalized.png |
| armored | assets/enemies/armadillo_bomber | normalized.png |
| boss | assets/enemies/bone_rifleman | normalized.png |
| iron_colonel | assets/bosses/iron_bull | normalized.png |
| storm_widow | assets/bosses/scorpion_queen | normalized.png |
| grave_keeper | Existing procedural layers | No replacement |

All nine mapped visuals are replaced. Their old procedural bodies and weapons
are used only if the PNG fails to load or its dimensions are invalid. During
loading, the mapped sprite waits for the PNG. `grave_keeper` intentionally keeps
its existing artwork, including its attacks and enraged appearance. There is no
procedural body/weapon underneath a successfully loaded PNG.

## Compilation and source limitations

Run `node tools/build_enemy_atlas.cjs` after changing the supplied assets. The
compiler reads the root manifest and each design's atlas for frame dimensions,
animation columns, directions, FPS and loop settings. It emits a classic-script
atlas for local-file compatibility and one normalized PNG per design. Original
assets remain unchanged. `node tools/version_game_assets.cjs` refreshes HTML
script revisions; PNG URLs include a SHA256 content revision.

Generated sources contain pure red/yellow/green guide artifacts, isolated noise,
and low-alpha fringes. Compilation removes these, measures the connected bodies
and dark structural landmarks, and aligns all frames at a shared ground pivot.
Smoke, flashes and attack reach do not determine body scale. Ordinary bodies are
54 pixels high (brute 62, armored 58); replaced bosses are 94–100 pixels high,
relative to the player's approximately 60-pixel body. Feet remain at the original
visual sole offset from each entity's collision center; collision radii are untouched.

The normalized tiles have transparent margins and tight draw crops; source crops
never sample a neighboring tile. All 576 output frames pass nonempty/margin,
body-height and common-anchor checks. Some supplied drawings already touch the
160-pixel source boundaries: 6 coyote, 2 vulture, 2 dust bandit, 7 scorpion brute,
2 cactus spitter, 2 armadillo, 19 bone rifleman, 10 iron bull and 10 queen frames.
Missing source extremities cannot be reconstructed by alignment. Minor anatomy
and pose variations inherent in the generated art remain. Detailed measurements
are recorded in `tools/enemy-measurements.generated.json`.

## Animation and combat

WeakMap records keep visual state outside combat entities. Spawn registration
captures the original position. Each simulation tick measures actual movement;
eight-way facing follows movement, committed attack aim, or telegraph aim.
Walking loops at 8 FPS only while moving; idle holds frame zero and the last
direction. Movement transitions reset the walk clock. Attack events start a
four-frame, 10 FPS, nonlooping sequence, then return to walking/idle. Pellets from
one volley share the same event timestamp. Render calls do not advance clocks,
change entities, allocate canvases, read pixels, or consume combat randomness.
Pause, upgrades and knowledge questions stop the simulation clock; elemental
freezing also stops the sprite clock.

Existing projectile emission triggers ranged attacks. The original contact hit
triggers the melee visual. Boss hazard resolution triggers attack poses with its
committed target; warning geometry and phase mechanics remain unchanged. The
rifles, bombs, claws and spit depicted in the new art add no mechanics. Existing
element overlays, damage feedback, health bars, rage indicators and procedural
death fragments remain active.

## Verification

Commands:

```sh
node tools/check_enemy_png.cjs
node tools/check_enemy_sprites.cjs
node tools/check_roster_bosses.cjs
node tools/check_enemies_browser.cjs 9236
```

The browser check requires Chrome with remote debugging on the specified port.
It exercises the actual HTML and rendering pipeline over HTTP, and opens both
unmodified HTML entries with `file://`. Its temporary HTTP response exposes the
game API for deterministic tests; production has no debugging API. It verifies
all nine images were actually drawn, all ten enemies' real normal/enraged
attacks, eight directions and every animation frame, pause, pure rendering and
zero canvas allocations during gameplay. The gallery screenshot is
`tools/enemies-game.generated.png`; the machine-readable browser report is
`tools/enemies-browser.generated.json`.

The existing enemy art, roster/boss, elemental, enemy level, balance, no-hit,
match duration, enemy XP, chest, sprite-loading, hero and weapon checks passed.
A temporary copy of the pre-change main script also verified 2,400 identical
simulation frames across six regular enemies, four bosses and eight evolved
weapons, including phase transitions, deaths, rewards and combat RNG.

`tools/check_player_sprite.cjs` has an existing stale expectation at line 77:
it expects dynamite damage 70, but both HEAD and the pre-integration game use 50.
That test still fails there. Its assertions and the game's balance were preserved.
The independent balance and enemy regression suites pass.

Performance measurements are recorded by the browser check for 300 enemies,
both the PNG and procedural renderer, and full world drawing. These are headless
software-rendering timings, not a hardware FPS guarantee or a mobile playtest.
The measured sprite-only cost was 36,35 ms per 300-enemy frame for PNGs versus
97,57 ms for the procedural fallback. Full update/world drawing cost 114,50 ms
with PNGs, versus 204,04 ms for world drawing with procedural enemies. The full
300-enemy scene remains expensive in this software-rendered environment.

## Files

Modified: `README.md`, `index.html`, `js/enemy_sprites.js`, `js/main.js`,
`js/bosses.js`, `tools/game_fixture.cjs`, `tools/check_enemy_sprites.cjs`,
`docs/enemy-pixel-art.md`, `docs/characters-and-bosses.md`.

Created: root `manifest.json`; the nine mapped asset directories (four original
files plus `normalized.png` each); `assets/enemy_atlas.js`;
`tools/build_enemy_atlas.cjs`; `tools/check_enemy_png.cjs`;
`tools/check_enemies_browser.cjs`; this document; the browser JSON, gallery PNG
and measurement JSON named above. A temporary ignored
`tools/enemy-baseline.generated.js` preserves the pre-change main script for
the optional baseline regression check.
