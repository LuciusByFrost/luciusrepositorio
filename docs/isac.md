# Professor Isac — implementation and remaining artwork

The merchant, Bits, permanent upgrades and Knowledge Chest presenter interface
are implemented. Character artwork integration is incomplete: the requested
`assets/npcs/isac/isac_spritesheet.png` is absent from this workspace. No Isac
image could be inspected or extracted, and no character art was generated or
substituted. The current interface displays Isac's name where his portrait will
appear. It does not request nonexistent PNGs.

## Files

Created:

- `js/isac_shop.js`: progression account, purchases, bonuses, art loading and DOM UI.
- `isac.css`: wood panels, turquoise circuit-like accents, scrolling layouts.
- `assets/npcs/isac/README.md`: exact missing source and extraction requirements.
- `tools/check_isac_shop.cjs`: progression, real-game hooks and DOM/loader tests.
- `tools/check_isac_browser.cjs`: isolated Chromium rendering/layout test.
- `docs/isac.md`: this report.
- `tools/isac-browser.generated.log`: generated browser failure evidence.

Modified:

- `js/main.js`: title menu entry and L shortcut, shop navigation, new-match
  bonuses, death/quiz/victory rewards, and presenter panel synchronization.
- `index.html`: new stylesheet/module, with content-based cache revisions.
- `tools/game_fixture.cjs`: loads the real merchant module, supports a shared
  save Map for reload tests, and exposes additional game functions to tests only.
- `tools/check_match_duration.cjs`: keeps the original exact legacy-save write
  assertions and adds separate assertions for exactly one 150-Bit victory reward
  and exactly one Bits-save write. Repeated completion callbacks remain checked.
- `README.md`: link to this implementation report.

No playable-character artwork or atlas was modified. The previous duplicate
sprite cleanup is preserved. `network_questions.js` and `knowledge_chests.js`
are unchanged. There are no new libraries, network resources or production
debugging APIs. No commit or push was made.

## Sprites

No extracted sprites exist, so their actual dimensions are unknown. Supply
the approved `assets/npcs/isac/isac_spritesheet.png` (or identify its local path).
Pending extraction targets are:

| Target | Dimensions/status |
| --- | --- |
| `isac_idle.png` | Unknown; source absent |
| `isac_talk.png` | Unknown; source absent |
| `isac_sell.png` | Unknown; source absent |
| `isac_portrait.png` | Unknown; source absent |
| `isac_happy.png` | Unknown; source absent |
| `isac_surprised.png` | Unknown; source absent |
| `isac_shop.png` | Unknown; source absent |

The sheet must be inspected as an illustrated layout, not split as a uniform
atlas. Only clean, technically identifiable crops may be extracted. Isac's slim
cowboy body, clothing, facial details, palette and proportions must remain intact.
Unsuitable crops must be reported; missing animations must not be invented.

The module supports an optional `globalThis.ISAC_ART` map, defined before it
loads, with `portrait`, `happy`, `surprised`, `shop`, `sell`, `talk`, and `idle`
paths. Configure it only after real extraction/inspection. It preloads configured
assets, uses natural aspect ratios and pixelated rendering, and prefers the
portrait if an expression is unavailable. A failed optional image has a tracked
error state and falls back to the portrait/name. The shop prefers its shop image,
then its selling image, then its portrait. Talking/idle paths are supported by
the loader, but no animation sequence is invented from uninspected artwork.

## Shop and permanent upgrades

Click **LOJA DO ISAC** on the title screen, or press **L**. The shop displays
the Bits balance, six upgrade cards, current levels, effects and next prices.
Purchases require a second **Confirmar compra** action; **Cancelar** spends
nothing. **VOLTAR** or Escape returns to the title. Simulation does not advance
in the shop. Portuguese opening, purchase, insufficient-funds and maximum-level
dialogue uses the requested wording.

| Upgrade | Per-level effect | Cap | Initial price |
| --- | --- | --- | --- |
| Overclock | +3% damage | 5 | 150 |
| Processador Turbo | +2% movement | 5 | 150 |
| Memória RAM | +5 maximum/current starting HP | 5 | 150 |
| Firewall | +2 percentage points damage reduction | 5 | 200 |
| Rede Otimizada | +2% attack speed | 5 | 200 |
| Coletor de Dados | +5% pickup radius | 5 | 125 |

Next price is `ceil(initialPrice * 1.8 ** currentLevel)`. Prices increase for
every level, making later permanent bonuses require multiple encounters/runs
rather than letting an early kill buy an upgrade. Runtime spawn rates are
unchanged. These prices still need playtesting with actual player kill rates.

The account lives in `localStorage['cactus-isac-save']` (schema version 1),
separate from the existing `cactus-save`. Invalid balances/levels are sanitized;
levels are clamped to 0–5 and balances to nonnegative safe integers. A purchase
commits its complete new state before updating the in-memory account; a storage
failure grants no upgrade and deducts no Bits, and the UI reports the failure.
If storage is unavailable, rewards cannot be persisted and are not credited.

Bonuses apply once to each new game object. Damage, movement, attack speed and
pickup multipliers are additive by permanent level relative to starting stats;
ordinary in-match upgrades retain their existing formulas. Combined defense
remains capped at 35%. No Hit starts at 1 HP, ignores permanent HP/defense,
sets regeneration to zero, and retains the original fatal-hit path regardless
of armor/regeneration values. Offensive/movement/pickup bonuses still apply.

## Bits

| Event | Bits |
| --- | --- |
| Regular enemy defeat | 1 |
| Boss defeat | 50 total, not 50 plus the regular reward |
| Correct Knowledge Chest answer | 25 |
| 15-minute victory | 150 |
| Incorrect answer or defeat | 0 |

Enemy rewards use the existing defeated-enemy removal path. Correct quiz rewards
use the existing single-claim guard, and victory uses the existing completed-game
guard. The merchant additionally deduplicates each event kind by its source object
without mutating gameplay entities or consuming RNG. Repeat callbacks do not
grant another reward. Started matches are not saved/resumed by the original game;
deduplication is scoped to the running session, while balances/purchases persist.

## Knowledge Chest layout

The existing question selection, shuffling, four answers, explanations, XP and
weapon-reward logic are preserved. The new DOM panel shows **DESAFIO DO PROFESSOR
ISAC**, with a portrait area in the left grid column and question/answers in the
right column. Correct and incorrect feedback uses the requested cowboy dialogue,
the unchanged explanation and existing reward text. A configured happy/surprised
image replaces the portrait for the corresponding result. Those real images are
not present yet; only the loader behavior has been tested with simulated images.

Answers use real accessible buttons. Number keys 1–4 still work, and continuing
or closing resumes the existing game/queued-upgrade flow. On mobile, the portrait
area remains to the left at 64 pixels wide while answers use one column and
readable text. The whole panel scrolls vertically for long content and landscape
screens. CSS preserves image aspect ratio. Actual browser/mobile appearance
remains unverified due to the browser failure below.

## Validation

Passing new test: `node tools/check_isac_shop.cjs` checks all six purchase caps,
increasing prices, balances, confirmation/cancellation, save reloads and corrupt
saves, failed storage writes, exactly-once bonuses/rewards, actual enemy/boss
removal, all 60 correct and incorrect quiz branches, original XP rewards,
victory/defeat, the 35% defense cap, fatal No Hit, title/shop navigation, DOM left
portrait structure, dialogue, simulated expression loading/error fallback and
mobile CSS contracts. It does not claim actual sprite loading or visual layout.

Passing existing commands (under `tools/`, extension `.cjs`):

- `check_hero_sprites`, `check_sprite_loading`, `check_weapon_sprites`
- `check_elements`, `check_chests`, `check_roster_bosses`
- `check_enemy_sprites`, `check_enemy_png`, `check_enemy_xp`
- `check_character_art`, `check_balance`, `check_enemy_levels`
- `check_match_duration`, `check_no_hit`

`check_player_sprite.cjs` was executed but fails before comparison because it
requires `git show HEAD:js/main.js`; this supplied workspace has no Git history.
It was not weakened or replaced by a comparison against the current game itself.

`node tools/check_isac_browser.cjs` was executed in an isolated Edge profile.
Edge closed/crashed with `GPU process isn't usable`, so rendering checks could
not complete. No browser sandbox restrictions were disabled. The test includes
real assets/console checks and shop/quiz geometry checks at 1280×800, 360×640,
320×568 and 640×360 for a functioning Chromium environment. Set `CACTUS_BROWSER`
to a different installed Chromium executable to run there. No screenshots or
visual-pass result were produced in this environment.

Syntax checks passed for the new module, modified main script and browser test.
HTML asset revisions were regenerated and the existing cache/loading check passed.

Remaining requirements: supply and inspect the approved Isac sheet; extract only
clean sprites and record real dimensions; wire the inspected assets; complete
browser/mobile rendering verification; playtest prices. The functional merchant
and quiz integration must not be described as complete artwork integration yet.
