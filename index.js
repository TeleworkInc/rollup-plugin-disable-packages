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
      const ast = esprima.parseModule(code);
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
              replaceSource += `const ${name} = null;\n`;
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
            console.log(node);
            node.init = {
              type: 'Identifier',
              name: 'null',
            };
            console.log(node);
          }
        },
      });

      return codeGen.generate(replaced);
    },
  };
};

module.exports = disablePackages;
