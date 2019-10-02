/* eslint-env node */

// NOTE: we are in ./build
const esmRequire = require('esm')(module);
esmRequire('../src/electron/main.js');
