const disablePackages = require('.');

module.exports = [
  {
    input: 'test/index.mjs',
    output: {
      file: 'build/index.mjs',
      format: 'esm',
    },
    plugins: [
      disablePackages('chalk'),
    ],
  },
  {
    input: 'test/index.cjs',
    output: {
      file: 'build/index.cjs',
      format: 'cjs',
    },
    plugins: [
      disablePackages('chalk'),
    ],
  },
];
