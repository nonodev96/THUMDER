import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import { PublicRoutes, PublicRoutesList } from "./types";
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

export const AUTH_ROUTES: PublicRoutesList = [
  {
    lang: 'FILE-MANAGER',
    path: 'file-manager',
    routerLink: '/auth/file-manager',
    displayName: 'file-manager',
    data: {breadcrumb: 'File Manager'}
  },
  {
    lang: "IDE",
    path: "ide",
    routerLink: '/auth/ide',
    displayName: 'IDE',
    data: {breadcrumb: 'IDE'}
  },
  {
    lang: "PIPELINE",
    path: "pipeline",
    routerLink: '/auth/pipeline',
    displayName: 'Pipeline',
    data: {breadcrumb: 'Pipeline'}
  },
  {
    lang: "CYCLE-CLOCK-DIAGRAM",
    path: "cycle-clock-diagram",
    routerLink: '/auth/cycle-clock-diagram',
    displayName: 'Cycle clock diagram',
    data: {breadcrumb: 'Cycle-clock-diagram'}
  },
  {
    lang: "MEMORY",
    path: "memory",
    routerLink: '/auth/memory',
    displayName: 'Memory',
    data: {breadcrumb: 'Memory'}
  },
  {
    lang: "CODE",
    path: "code",
    routerLink: '/auth/code',
    displayName: 'Code',
    data: {breadcrumb: 'Code'}
  },
  {
    lang: "REGISTERS",
    path: "registers",
    routerLink: '/auth/registers',
    displayName: 'Registers',
    data: {breadcrumb: 'Registers'}
  },
  {
    lang: "PROFILE",
    path: "profile",
    routerLink: '/auth/profile',
    displayName: 'Profile',
    data: {breadcrumb: 'Profile'}
  },
  {
    lang: "DOCUMENTATION",
    path: "documentation",
    routerLink: '/auth/documentation',
    displayName: 'Documentation',
    data: {breadcrumb: 'Documentation'}
  },
  {
    lang: "CONFIG",
    path: "config",
    routerLink: '/auth/config',
    displayName: 'Config',
    data: {breadcrumb: 'config'}
  }
]

export const PUBLIC_ROUTES: PublicRoutes = {
  lang: '/',
  path: '/',
  routerLink: '/',
  displayName: 'Home',
  data: {},
  children: [
    {
      lang: "DEBUG",
      path: "debug",
      routerLink: '/debug',
      displayName: 'Debug',
    },
    {
      lang: "LOGIN",
      path: "login",
      routerLink: '/login',
      displayName: 'Login',
    },
    {
      lang: "FORGOT-PASSWORD",
      path: "forgot-password",
      routerLink: '/forgot-password',
      displayName: 'Forgot password',
    },
    {
      lang: "REGISTER",
      path: "register",
      routerLink: '/register',
      displayName: 'Register',
    },
    // no layout views
    {
      lang: "LANDING",
      path: "landing",
      routerLink: '/landing',
      displayName: 'Landing',
    },
    // _admin views
    {
      lang: 'ADMIN',
      path: 'admin',
      routerLink: '/admin',
      displayName: 'Admin',
      data: {},
      children: []
    },
    // _auth views
    {
      lang: 'AUTH',
      path: 'auth',
      routerLink: '/auth',
      displayName: 'Auth',
      data: {breadcrumb: 'Auth'},
      children: AUTH_ROUTES,
    },
  ],

};
