/**
 * Custom angular webpack configuration
 */

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
  // config.externals = {
  //   "electron": "require('electron')",
  //   "child_process": "require('child_process')",
  //   "fs": "require('fs')",
  //   "url": "require('url')",
  //   "pixi.js-keyboard": require('pixi.js-keyboard'),
  //   "pixi.js-mouse": require('pixi.js-mouse')
  // }
  return config;
}
