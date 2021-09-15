import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import { PublicRoutes } from "./types";
import { SocketIoConfig } from "ngx-socket-io";

export const DEFAULT_LANG = 'sp';

export const DEFAULT_CONFIG_TOAST: Partial<IndividualConfig> = {
  progressBar: true,
  progressAnimation: 'decreasing',
  closeButton: true
}

export const CONFIG_WEBSOCKET: SocketIoConfig = {
  url: 'http://localhost:3000',
  options: {
    transports: ['websocket'],
    reconnection: false
  }
};

export const PUBLIC_ROUTES: PublicRoutes = {
  path: '/',
  routerLink: '/',
  displayName: 'Home',
  data: {},
  children: [
    {
      path: "debug",
      routerLink: '/debug',
      displayName: 'Debug',
    },
    {
      path: "login",
      routerLink: '/login',
      displayName: 'Login',
    },
    {
      path: "forgot-password",
      routerLink: '/forgot-password',
      displayName: 'Forgot password',
    },
    {
      path: "register",
      routerLink: '/register',
      displayName: 'Register',
    },
    // no layout views
    {
      path: "landing",
      routerLink: '/landing',
      displayName: 'Landing',
    },
    // _admin views
    {
      path: 'admin',
      routerLink: '/admin',
      displayName: 'Admin',
      data: {},
      children: []
    },
    // _auth views
    {
      path: 'auth',
      routerLink: '/auth',
      displayName: 'Auth',
      data: {breadcrumb: 'Auth'},
      children: [
        {
          path: 'file-manager',
          routerLink: '/auth/file-manager',
          displayName: 'file-manager',
          data: {breadcrumb: 'File Manager'}
        },
        {
          path: "ide",
          routerLink: '/auth/ide',
          displayName: 'IDE',
          data: {breadcrumb: 'IDE'}
        },
        {
          path: "pipeline",
          routerLink: '/auth/pipeline',
          displayName: 'Pipeline',
          data: {breadcrumb: 'Pipeline'}
        },
        {
          path: "cycle-clock-diagram",
          routerLink: '/auth/cycle-clock-diagram',
          displayName: 'Cycle clock diagram',
          data: {breadcrumb: 'Cycle-clock-diagram'}
        },
        {
          path: "memory",
          routerLink: '/auth/memory',
          displayName: 'Memory',
          data: {breadcrumb: 'Memory'}
        },
        {
          path: "code",
          routerLink: '/auth/code',
          displayName: 'Code',
          data: {breadcrumb: 'Code'}
        },
        {
          path: "registers",
          routerLink: '/auth/registers',
          displayName: 'Registers',
          data: {breadcrumb: 'Registers'}
        },
        {
          path: "profile",
          routerLink: '/auth/profile',
          displayName: 'Profile',
          data: {breadcrumb: 'Profile'}
        },
        {
          path: "documentation",
          routerLink: '/auth/documentation',
          displayName: 'Documentation',
          data: {breadcrumb: 'Documentation'}
        }
      ],
    },
  ],

};
