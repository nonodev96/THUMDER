/**
 * Custom angular webpack configuration
 */
const path = require('path');

module.exports = (config, options) => {
  config.target = 'electron-renderer';
  if (options.fileReplacements) {
    for (let fileReplacement of options.fileReplacements) {
      if (fileReplacement.replace !== 'src/environments/_environment.ts') {
        continue;
      }
      let fileReplacementParts = fileReplacement['with'].split('.');
      if (fileReplacementParts.length > 1 && ['web'].indexOf(fileReplacementParts[1]) >= 0) {
        config.target = 'web';
      }
      break;
    }
  }

  // Monaco editor ESM modules import their own CSS files; add a css-loader rule
  // so webpack can process them (Monaco styles are also included via monaco-editor.scss)
  config.module.rules.push({
    test: /\.css$/,
    include: [path.resolve(__dirname, 'node_modules/monaco-editor')],
    use: ['css-loader'],
  });

  // @babel/plugin-transform-runtime generates imports to regeneratorValues but
  // this helper doesn't ship as a standalone file in @babel/runtime.
  // Alias it to our local stub that provides the same functionality.
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};
  const babelRuntimePath = path.resolve(__dirname, 'node_modules/@babel/runtime');
  config.resolve.alias[babelRuntimePath + '/helpers/esm/regeneratorValues'] =
    path.resolve(babelRuntimePath, 'helpers/esm/regeneratorValues.js');
  config.resolve.alias[babelRuntimePath + '/helpers/regeneratorValues'] =
    path.resolve(babelRuntimePath, 'helpers/regeneratorValues.js');

  return config;
}
