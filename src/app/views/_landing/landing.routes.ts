import type { Routes } from "@angular/router";
import { LayoutLandingComponent } from "@layout/landing/layout-landing.component";
import { AboutView } from "@views/_landing/about/about.view";
import { LandingView } from "@views/_landing/landing/landing.view";

export const landingRoutes: Routes = [
  {
    path: "",
    component: LayoutLandingComponent,
    children: [
      { path: "landing", component: LandingView, data: { breadcrumb: "Landing" } },
      { path: "about", component: AboutView, data: { breadcrumb: "About" } },
      { path: "**", redirectTo: "about" },
    ],
  },
];
