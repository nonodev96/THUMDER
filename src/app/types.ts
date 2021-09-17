declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}
export type PublicRoutes = {
  path: string,
  routerLink: string,
  displayName: string,
  data?: any;
  children?: PublicRoutes[],
};
