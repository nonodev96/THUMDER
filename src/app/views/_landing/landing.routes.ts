import type { Routes } from "@angular/router";
import { LayoutLandingComponent } from "@layout/landing/layout-landing.component";
import { AboutView } from "@views/_landing/about/about.view";
import { LandingView } from "@views/_landing/landing/landing.view";
import { LegalView } from "@views/_landing/legal/legal.view";

export const landingRoutes: Routes = [
  {
    path: "",
    component: LayoutLandingComponent,
    children: [
      { path: "landing", component: LandingView, data: { breadcrumb: "Landing" } },
      { path: "about", component: AboutView, data: { breadcrumb: "About" } },
      { path: "privacy", component: LegalView, data: { breadcrumb: "Privacy", page: "privacy" } },
      { path: "legal", component: LegalView, data: { breadcrumb: "Legal", page: "legal" } },
      { path: "accessibility", component: LegalView, data: { breadcrumb: "Accessibility", page: "accessibility" } },
      { path: "**", redirectTo: "about" },
    ],
  },
];
