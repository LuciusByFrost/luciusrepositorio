// Shares the isolated Chromium launcher and real-asset error checks with Isac.
process.env.CACTUS_RENDER_CHECK='desert';
require('./check_isac_browser.cjs');
