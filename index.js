/**
 * @license MIT
 */
/**
 * @fileoverview
 * Entry point for module.
 */

const estraverse = require('estraverse');
const esprima = require('esprima');
const codeGen = require('escodegen');

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
       * Handle shebangs which might be in the beginning of files.
       */
      const hasShebang = shebangPattern.test(code);
      const shebangString = hasShebang
        ? code.match(shebangPattern)[0]
        : '';

      const ast = esprima.parseModule(code.replace(shebangPattern, ''));
      const replaced = estraverse.replace(ast, {
        enter: function(node, parent) {
          /**
           * ImportDeclarations[source.value in disabledPackages]
           */
          if (
            /** Catch `import ... from 'disabled'` */
            node.type === 'ImportDeclaration' &&
            disabledPackages.includes(node.source.value)
          ) {
            /**
             * Extract local variables that are assigned from this source.
             */
            let replaceSource = ``;
            for (const specifier of node.specifiers) {
              const name = specifier.local.name;
              replaceSource += `const ${name} = {};\n`;
            }

            return esprima.parseScript(replaceSource);
          }

          /**
           * Catch VariableDeclaration with assignment to `require()`
           */
          if (
            node.type === 'VariableDeclarator' &&
            node.init.type === 'CallExpression'
          ) {
            node.init = {
              type: 'ObjectExpression',
              properties: [],
            };
            console.log(node);
          }
        },
      });

      const replacedSource = codeGen.generate(replaced);
      return hasShebang
          ? shebangString + '\n' + replacedSource
          : replacedSource;
    },
  };
};

module.exports = disablePackages;
