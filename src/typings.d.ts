/* SystemJS module definition */
declare const nodeModule: NodeModule;

interface NodeModule {
  id: string;
}

interface Window {
  // biome-ignore lint/suspicious/noExplicitAny: Electron/Node.js runtime globals have no strict types
  process: any;
  // biome-ignore lint/suspicious/noExplicitAny: Electron runtime require
  require: any;
  // biome-ignore lint/suspicious/noExplicitAny: jQuery has separate @types but Window augmentation needs any
  jQuery: any;
  // biome-ignore lint/suspicious/noExplicitAny: jQuery shorthand
  $: any;
}
