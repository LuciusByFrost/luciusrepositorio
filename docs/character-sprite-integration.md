# Character sprite integration status — 2026-11-13

The approved attack artwork is already installed and active for all four heroes.
Final approval of the active walking artwork cannot be established from this
workspace. Existing walks are preserved to keep gameplay working; they are not
being designated as newly approved replacements. Full official-art integration
remains pending identification of the approved walking sheets.

## Official attack sources and active images

All paths below are relative to the project root. Each source is byte-identical
to its corresponding entry in `sprites_ataque_personagens.zip` and to the file
in `sprites_ataque_personagens/`. ZIP entries were hashed in memory without
extracting another copy. Every attack source is 887 × 1774 pixels.

| Hero | Official attack source | Active attack atlas PNG |
| --- | --- | --- |
| Nopal | `assets/characters/nopal/nopal_attack.png` | `assets/characters/nopal/attack_normalized.0003ac273af9.png` |
| Rosa | `assets/characters/rosa/rosa_attack.png` | `assets/characters/rosa/attack_normalized.446e4ea69dd3.png` |
| Bento | `assets/characters/bento/bento_attack.png` | `assets/characters/bento/attack_normalized.ee7eeb309c31.png` |
| Iris | `assets/characters/iris/iris_attack.png` | `assets/characters/iris/attack_normalized.b2fe103f0428.png` |

Source SHA-256 values, in the same order:

```text
nopal 59DD4613FDE07A4865ED3CF307B6D9FEA577A670CEB3E6F47B0A8A4A6B20785C
rosa  C6D5CB33A427D5FC4D95524BB4938128E626DAD15535121B687D2354B4107AB9
bento 6D9B8FEF05AECE203C3C0F627DE588D1B1AD9EB2A88B50B76B650595CABE579D
iris  82A9867F44954D857A9934B283D1233894A6FDD1AFE3171F449A7E05023EDBFE
```

## Walking artwork awaiting identification

| Hero | Existing source, retained for functionality | Active walking atlas PNG |
| --- | --- | --- |
| Nopal | `assets/characters/nopal/nopal_walk.png` (1086 × 1448) | `assets/characters/nopal/walk_normalized.a4fb4440c330.png` |
| Rosa | `assets/characters/rosa/rosa_walk.png` (1254 × 1254) | `assets/characters/rosa/walk_normalized.9ad7d5bb0cbc.png` |
| Bento | `assets/characters/bento/bento_walk.png` (1269 × 1240) | `assets/characters/bento/walk_normalized.03e876f08190.png` |
| Iris | `assets/characters/iris/iris_walk.png` (1287 × 1222) | `assets/characters/iris/walk_normalized.70fa75440cd0.png` |

Existing walking source SHA-256 values:

```text
nopal 77299FA59E3D0940D79F9C46EA4AF733BB8DCD28E94E202B371EBB2A98C8D52E
rosa  6A10CF522EB1151C692A4E17312EB9C0DEBFBE5E0D804F41F4F77B00360C8948
bento 7C39F6990B62A71D61A53C961BE811661A2141441DC80A010C1DE50C6C444580
iris  A4EFC2F2EC266940821046634E04FE750A1224E617CBBDE4A59377BA7CFC3B89
```

The user must supply the approved original transparent walking sheets for Nopal,
Rosa, Bento, and Iris, identifiable respectively as `nopal_walk.png`,
`rosa_walk.png`, `bento_walk.png`, and `iris_walk.png`, or confirm that the exact
existing files/hashes above are those approved originals. The current animation
layout expects six walking frames for each of eight directions: down,
down-left, left, up-left, up, up-right, right, down-right. If approved originals
use a different arrangement, supply their frame/direction mapping; do not redraw
them to fit this layout.

The older documentation records an origin under `C:/Users/user/Downloads`, but
does not establish approval of these particular walking files. No `.git` history
exists in this supplied workspace. Current hero files and extracted attack files
share a last-write timestamp of 2026-11-13 18:41:37 UTC, so that timestamp does not
rank artwork revisions. Attack ZIP entries are dated 2026-11-12 00:43:56 UTC.
The other supplied ZIP contains enemies/bosses and accompanying metadata, not
hero walking replacements. Character-named PNGs under `tools/` are prior preview
captures, not identifiable replacement source sheets.

## Runtime integration and rebuild decision

`index.html` loads each `assets/characters/<id>/atlas.js` before its character
module. Those modules use the shared `js/hero_sprite.js` renderer. The active
atlas images are the eight hashed PNGs listed above; source and extracted PNGs
are not alternative runtime sprite paths. The same atlases power the preview.
No references to the previously retired hero image filenames were found in the
active HTML, hero metadata, or JavaScript. The retained walks remain active with
approval status unresolved; this is not a claim that all active art is official.

The renderer uses eight explicit direction rows, six walk frames at 10 FPS and
four attack frames at 12.5 FPS. It locks attack aim while allowing movement,
then selects the current movement direction and walk/idle frame on recovery.
It does not require a separate `walk_attack` sheet. Pause uses the game clock.

Reviewed the existing shared PowerShell builder, its component measurement
script, and the Node HTML-version updater. The builder applies uniform scale
per frame, body/feet landmarks and crop offsets; it does not establish artistic
identity. No rebuild was necessary: all source and generated hashes, dimensions,
frame mappings, anchors and HTML cache revisions match. No source art, atlas
metadata, atlas PNG, animation offset, or cache revision was changed in this run.
PowerShell's effective policy still reports `Restricted`; there was no need to
change policy or introduce a second builder for unchanged, validated assets.

All cells are 128 × 128 with pivot (64,88); configured body heights are Nopal 60,
Rosa 62, Bento 60 and Iris 64 pixels. These are existing technical settings, not
evidence that the source drawings have identical proportions between states.

## Changes and cleanup

No artwork was replaced or removed in this final pass. The previous removal of
eight unversioned duplicates remains intact: `walk_normalized.png` and
`attack_normalized.png` in each hero directory. Each directory now contains
its two source sheets, two active hashed images and `atlas.js`. All remain
necessary either for current gameplay or rebuilding. Archives and extracted
sources were retained; no additional ZIP extraction was performed.

Only documentation and browser-attempt logs changed in this pass. Gameplay,
renderer code, source artwork and atlas-building scripts were preserved. No
artwork was generated, redesigned, recolored or stretched. No commit/push.

## Validation in this pass

14 existing Node commands passed (each under `tools/`, extension `.cjs`):

- `check_hero_sprites`: all 320 frames, eight directions, body/feet anchors,
  source/generated hashes, actual combat events, movement during attacks,
  recovery, pause and render purity.
- `check_sprite_loading`: exact URLs/dimensions, cache revisions, simulated
  load/error/recovery and no silent retired-body fallback.
- `check_weapon_sprites`: weapon crops, animation and combat/RNG equivalence.
  Its intentional missing-image diagnostic is part of the passing fallback test.
- `check_elements`, `check_chests`, `check_roster_bosses`, `check_enemy_sprites`,
  `check_enemy_png`, `check_enemy_xp`, `check_character_art`, `check_balance`,
  `check_enemy_levels`, `check_match_duration`, `check_no_hit`: passed.

An additional read-only pixel check used the existing PNG decoder to decode all
eight active PNGs and verify that all 320 cells are nonempty with transparent
cell margins. This checks actual pixel bounds rather than metadata alone.

`check_player_sprite.cjs` was executed but cannot pass: it requires
`git show HEAD:js/main.js`, and no Git history is supplied. It was not rewritten
to compare the current game against itself.

Browser rendering was attempted using installed Edge, a separate temporary
profile and Windows software rendering (`--use-angle=warp`), without disabling
the sandbox. Edge crashed before its debugging endpoint became available:
`GPU process isn't usable`. The log is
`tools/entrypoints-9236.generated.log`. The browser suite could not run;
there is no fresh browser assertion that all PNGs load without JavaScript errors.
The existing browser suite additionally assumes an absent historical redirect
entry and a previous folder name, as detailed in the prior audit.

## Unresolved visual differences

Prior direct inspection of these same hashed atlas images found a clear Nopal
silhouette change: the walk has a slimmer, ribbed cactus body and legs, while
the attack has a rounder head/body, broader hat/boots and softer shading.
Rosa has coat/tail and stance differences; Bento has equipment/detail and body
volume differences; Iris has coat/tail silhouette and shading differences.
These observations concern the supplied artwork, not a reason to alter approved
art. Static atlas inspection found no obvious clipping. Automated anchor and
scale checks do not prove visual identity or smooth animated transitions.

Final consistent-art sign-off remains pending identification of approved walking
art and a successful browser rendering check in a functioning browser environment.
