// Some libraries look for the `global` of Node.js: in the browser (and in the page of Electron, which has no Node.js) it
// is `window`. It was an inline script of index.html, which the Content Security Policy does not allow (SEG-03)
const scope = window as unknown as { global?: unknown };
scope.global ??= window;
