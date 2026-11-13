# Approved Isac artwork pending

The requested `isac_spritesheet.png` was not present in the supplied workspace.
No sprites were extracted or generated. Supply the approved original here so
its actual boundaries, background, labels and transparency can be inspected.

Pending outputs: `isac_idle.png`, `isac_talk.png`, `isac_sell.png`,
`isac_portrait.png`, `isac_happy.png`, `isac_surprised.png`, `isac_shop.png`.
No dimensions can be established without the source. Do not manufacture these
files from other characters or redraw Isac. Preserve his slim cowboy design.

`js/isac_shop.js` supports an optional `globalThis.ISAC_ART` map defined before
the module loads, with keys `idle`, `talk`, `sell`, `portrait`, `happy`,
`surprised`, `shop` pointing to inspected clean assets. The module preloads only
configured files. Until then the UI uses Isac's name and requests no missing PNGs.
