/**
 * @license MIT
 */
/**
 * @fileoverview
 * Entry point for module.
 */

const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');

const shebangPattern = /^#!.*/;

/**
 * Import `empty` instead of a given module.
 *
 * @param  {...string} disabledPackages
 * The name of the module to disable.
 *
 * @return {object}
 * The Rollup plugin object.
 */
const disablePackages = (...disabledPackages) => {
  return {
    name: 'disablePackages',
    renderChunk: (code, chunk, options) => {
      /**
       * Dump input code to a debugging file.
       */
      fs.writeFileSync(
          path.resolve(process.cwd(), 'debug.txt'),
          code,
      );

      /**
       * Handle shebangs which might be in the beginning of files.
       */
      const hasShebang = shebangPattern.test(code);
      const shebangString = hasShebang
        ? code.match(shebangPattern)[0] +'\n'
        : '';

      if (hasShebang) code = code.replace(shebangPattern, '');

      const output = babel.transformSync(code, {
        plugins: [
          // your first babel plugin 😎😎
          function myCustomPlugin() {
            return {
              visitor: {
                CallExpression(path) {
                  if (
                    path.node.callee.name === 'require' &&
                    path.node.arguments.length === 1 &&
                    disabledPackages.includes(path.node.arguments[0].value)
                  ) {
                    const newNode = babel.types.objectExpression([]);
                    path.replaceWith(newNode);
                  }
                },
                ImportDeclaration(path) {
                  if (
                    path.node.source.type === 'StringLiteral' &&
                    disabledPackages.includes(path.node.source.value)
                  ) {
                    const newNodes = [];
                    for (const specifier of path.node.specifiers) {
                      const disableName = specifier.local.name;
                      const newNode = babel.types.variableDeclaration(
                          'const',
                          [
                            babel.types.variableDeclarator(
                                babel.types.identifier(disableName),
                                babel.types.objectExpression([]),
                            ),
                          ],
                      );
                      newNodes.push(newNode);
                    }
                    path.replaceWithMultiple(newNodes);
                  }
                },
              },
            };
          },
        ],
      });

      return shebangString + output.code;
    },
  };
};

module.exports = disablePackages;
