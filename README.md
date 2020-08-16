# Disable packages
Replace all `import {a, b, c} from 'myPackage'` statements with `const a = {};
const b = {}; const c = {};` and so on, effectively disabling those packages.

Specifically designed to silence `fsevents` errors in Rollup and Webpack.