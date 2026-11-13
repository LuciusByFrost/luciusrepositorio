# Sprite audit — 2026-11-13

See [the final integration status](character-sprite-integration.md) for the
current official attack files, walking approval gap, validation results and
remaining requirements. The entries below preserve the investigation history.

Shell execution and workspace writes work. The project is in the nested
`luciusrepositorio-main` directory. There is no `.git` directory in the supplied
workspace, so Git history and the `HEAD` gameplay comparison are unavailable.

All four installed attack source PNGs match both `sprites_ataque_personagens.zip`
and its extracted directory by SHA-256. The other ZIP contains 39 enemy/boss
and accompanying metadata entries, with no hero replacements. The walking sheets
are the versions described by `hero-sprites.md`; no newer walking candidates
were found in this workspace. Approval/newness beyond these supplied sources
cannot be established without the previous history or additional source assets.

The existing hero check passes for 192 walking and 128 attack frames, including
source and generated-image hashes, crop bounds, body heights, foot anchors,
directions, idle, combat, movement, recovery, pause, and rendering purity.

The atlas rebuild was attempted using `tools/build_hero_atlases.ps1`, but Windows
PowerShell rejected script execution. `Get-ExecutionPolicy` reports `Restricted`.
No policy was changed or bypassed, and no atlases were rebuilt during this audit.
The PowerShell browser verification was therefore not run.

The existing Node asset-version tool refreshed stale HTML cache revisions.
Removed only `walk_normalized.png` and `attack_normalized.png` in each of the
four hero directories: each was unreferenced by code/build tools and identical
by SHA-256 to its retained, active hashed PNG. Source sheets, hashed images,
atlases, archives, extracted sources, and gameplay code were preserved.

Passing existing Node checks: `check_hero_sprites`, `check_sprite_loading`,
`check_weapon_sprites`, `check_elements`, `check_chests`, `check_roster_bosses`,
`check_enemy_sprites`, `check_enemy_xp`, `check_character_art`, `check_balance`,
`check_enemy_levels`, `check_match_duration`, and `check_no_hit` (all under
`tools/`, extension `.cjs`). Hero and loading checks were rerun after cleanup.
`check_player_sprite.cjs` cannot run because it requires `git show HEAD:js/main.js`.

No commit or push was performed. Completing the requested rebuild requires
permission to execute the existing PowerShell build script; completing the
historical gameplay comparison requires the original Git checkout.

## Follow-up verification — 2026-11-13

A temporary, harmless `.ps1` containing only `Write-Output` was created, invoked,
and removed. Invocation still failed with `PSSecurityException / UnauthorizedAccess`.
The tool-launched PowerShell process reports effective policy `Restricted`, with
all individual policy scopes `Undefined`. The terminal-session policy change
reported by the user is not visible to this process. No policy was changed.

Reviewed `build_hero_atlases.ps1`, `measure_hero_sheets.ps1`, the Nopal/Bento/Iris
compatibility build entries, and `version_game_assets.cjs`. The shared builder
measures connected components, requires 48 walk/32 attack figures per hero,
includes nearby detached effects, uses warm-color head/boot landmarks, and scales
each frame uniformly to the configured body height. It writes hashed PNGs and
atlas metadata, then refreshes HTML revisions. It does not modify gameplay code.
Its color/width heuristics establish alignment, not artistic consistency.

All 13 previously passing Node checks listed above pass again, including source
hashes, eight active PNG hashes, dimensions, URLs, all 320 frames, and simulated
loader success/failure handling. No stale source/atlas mismatch was detected to
justify replacing the existing baked images. A rebuild was not performed because
script execution remains blocked. `check_player_sprite.cjs` still fails at its
required `git show HEAD:js/main.js` call because the checkout has no Git history.

Visual inspection covered the actual eight active hashed atlas PNGs, all their
rows and columns, as well as the pre-existing source/render comparison image.
The latter is historical evidence, not a freshly captured browser result.

| Hero | Observations from the current static atlas images |
| --- | --- |
| Nopal | Clear mismatch: walk has a narrow, vertically ribbed cactus body and slimmer legs; attack has a rounder head/body, broader hat and boots, and softer shading. Equal height/feet do not remove this silhouette change. |
| Rosa | Design remains recognizable; attack stance is wider/crouched with differences in coat/tail volume and shading. These are visible differences, not proof of a seamless transition. |
| Bento | Hat, muzzle, shell and equipment remain recognizable; chest/equipment detail and apparent bulk vary between states. The front/back thrown dynamite extends past the feet/hat intentionally. |
| Iris | Ears, hat, scarf, tail and turquoise accents remain recognizable; coat/tail silhouette and shading vary with the attack poses. Extended rope loops are visible in the attack atlas. |

No obvious cell-edge clipping or neighboring-character fragments were seen in
the viewed static atlas images. This observation does not establish frame pacing,
smooth animated transitions, or complete artistic consistency. No artwork was
generated, distorted, or substituted to hide the differences.

Chrome is absent at the browser wrapper's configured path. Microsoft Edge was
found and launched headlessly with its own temporary profile for the existing
`check_heroes_browser.cjs` check. It crashed during GPU initialization
(`GPU process isn't usable`); the waiting check was stopped. Browser loading and
animated transitions remain unverified in this run. No browser sandbox settings
were disabled. The wrapper/check also assumes the old project layout: it names
`luciusrepositorio/index.html` (absent here) and asserts the historical
`/luciusbyfroty/index.html` path. Those assumptions need attention before claiming
a complete entrypoint test in this extracted folder.

This follow-up changed only this audit document and generated browser logs. It
made no gameplay, source-art, atlas, or build-script changes, and no commit/push.
