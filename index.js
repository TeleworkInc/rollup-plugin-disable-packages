/**
 * @license MIT
 */
/**
 * @fileoverview
 * Entry point for module.
 */

const fs = require('fs');
const estraverse = require('estraverse');
const esprima = require('esprima');
const astReplace = require('ast-replace');
const codeGen = require('escodegen');
const esquery = require('esquery');

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
  const namesPattern = disabledPackages.join('|');
  const importPattern = new RegExp(
      `(?<=import.*?)from\\s+['"\`]${namesPattern}['"\`]`,
  );
  const requirePattern = new RegExp(
      `require\\s*\\(.+?${namesPattern}.+?\\)`,
  );
  // console.log(requirePattern);

  return {
    name: 'disablePackages',
    // renderChunk: (code, chunk, options) => (
    //   (options.format === 'es')
    //       ? code.replace(
    //           importPattern,
    //           `from 'empty'`,
    //       )
    //       : code.replace(
    //           requirePattern,
    //           `null`,
    //       )
    // ),
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
    // writeBundle: (options, bundles) => {
    //   for (const [file, bundle] of Object.entries(bundles)) {
    //     console.log(options.format);
    //     bundle.code = (options.format === 'es')
    //       ? bundle.code.replace(
    //           /(?<=import.*?)from\s+['"`]chalk['"`]/,
    //           `from 'empty'`,
    //       )
    //       : bundle.code.replace(
    //           /require\s*\(.+?chalk.+?\)/,
    //           `require('empty')`,
    //       );
    //   }
    //   console.log(bundles);
    //   return 'test = 32';
    //   // const ast = esprima.parseModule(bundle.code);
    //   // const importStatements = esquery.query(
    //   //     ast,
    //   //     'ImportDeclaration',
    //   // );
    //   // const requireStatements = esquery.query(
    //   //     ast,
    //   //     'CallExpression[callee.name="require"]',
    //   // );
    //   // console.log({ importStatements, requireStatements });
    //   // astReplace(ast, {
    //   //   CallExpression:
    //   // });
    // },
  };
};

module.exports = disablePackages;
