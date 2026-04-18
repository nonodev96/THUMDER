/* SystemJS module definition */
declare const nodeModule: NodeModule;

declare module "pixi.js-keyboard" {
  export function update(): void;
  export function isKeyDown(...keys: string[]): boolean;
  export function isKeyUp(...keys: string[]): boolean;
  export function isKeyPressed(...keys: string[]): boolean;
  export function isKeyReleased(...keys: string[]): boolean;
}

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
