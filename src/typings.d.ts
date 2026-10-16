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
}

// DLX programs imported as text (angular.json: "loader": { ".s": "text" })
declare module "*.s" {
  const content: string;
  export default content;
}

// Monaco without its 80 languages and their workers (REN-02): the editor and its features, with the API of editor.api
declare module "monaco-editor/esm/vs/editor/edcore.main.js" {
  export * from "monaco-editor/esm/vs/editor/editor.api.js";
}
