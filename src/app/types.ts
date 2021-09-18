declare global {
  interface Window {
    process: any;
    require: any;
    jQuery: any;
    $: any;
  }
}
export type PublicRoutes = {
  path: string,
  routerLink: string,
  displayName: string,
  data?: any;
  children?: PublicRoutes[],
};
