// Decode the supplied WebP to PNG without resizing, filtering or recoloring.
const path=require('node:path');
if(!process.argv[2])throw Error('Usage: node tools/prepare_night_terrain.cjs <approved image>');
process.env.CACTUS_NIGHT_INPUT=path.resolve(process.argv[2]);
process.env.CACTUS_RENDER_CHECK='prepare-night';
require('./check_isac_browser.cjs');
