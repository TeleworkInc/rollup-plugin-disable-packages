/**
 * @license MIT
 */
/**
 * @fileoverview
 * Entry point for module.
 */

const fs = require('fs');
const esprima = require('esprima');
const astReplace = require('ast-replace');
const codeGen = require('escodegen');
const esquery = require('esquery');

/**
 * Import `empty` instead of a given module.
 *
 * @param  {...string} names
 * The name of the module to disable.
 *
 * @return {object}
 * The Rollup plugin object.
 */
const disablePackages = (...names) => {
  const namesPattern = names.join('|');
  const importPattern = new RegExp(
      `(?<=import.*?)from\\s+['"\`]${namesPattern}['"\`]`,
  );
  const requirePattern = new RegExp(
      `require\\s*\\(.+?${namesPattern}.+?\\)`,
  );
  // console.log(requirePattern);

  return {
    name: 'disablePackages',
    renderChunk: (code, chunk, options) => (
      (options.format === 'es')
          ? code.replace(
              importPattern,
              `from 'empty'`,
          )
          : code.replace(
              requirePattern,
              `null`,
          )
    ),
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
