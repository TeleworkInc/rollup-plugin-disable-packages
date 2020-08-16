/**
 * @license MIT
 */
/**
 * @fileoverview
 * Entry point for module.
 */

const path = require('path');
const fs = require('fs');
const estraverse = require('estraverse');
const esprima = require('esprima');
const codeGen = require('escodegen');

const babel = require('@babel/core');

const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse');
const generate = require('@babel/generator');

const requirePattern = /(?<=[;\n]).*=\s*require\(.*\)[;\s]?/g;
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
        ? code.match(shebangPattern)[0]
        : '';

      if (hasShebang) code = code.replace(shebangPattern, '');

      // const ast = parse(
      //     code.replace(shebangPattern, ''),
      //     {
      //       sourceType: 'module',
      //     },
      // );

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

      return output.code;

      // const replaced = estraverse.replace(ast.program, {
      //   enter: function(node, parent) {
      //     /**
      //      * ImportDeclarations[source.value in disabledPackages]
      //      */
      //     if (
      //       /** Catch `import ... from 'disabled'` */
      //       node.type === 'ImportDeclaration' &&
      //       disabledPackages.includes(node.source.value)
      //     ) {
      //       /**
      //        * Extract local variables that are assigned from this source.
      //        */
      //       let replaceSource = ``;
      //       for (const specifier of node.specifiers) {
      //         const name = specifier.local.name;
      //         replaceSource += `const ${name} = {};\n`;
      //       }

      //       const replaceAst = parse(
      //           replaceSource,
      //           {
      //             sourceType: 'module',
      //           },
      //       );
      //     }

      //     /**
      //      * Catch VariableDeclaration with assignment to `require()`
      //      */
      //     if (
      //       node.type === 'VariableDeclarator' &&
      //       node.init.type === 'CallExpression'
      //     ) {
      //       node.init = {
      //         type: 'ObjectExpression',
      //         properties: [],
      //       };
      //       // console.log(node);
      //     }
      //   },
      // });

      // const replacedSource = codeGen.generate(replaced);
      // return hasShebang
      //     ? shebangString + '\n' + replacedSource
      //     : replacedSource;
    },
  };
};

module.exports = disablePackages;
