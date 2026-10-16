import type { Routes } from "@angular/router";
import { LayoutAuthComponent } from "@layout/auth/layout-auth.component";
import { PageNotFoundComponent } from "@shared/components";
import { IndexView } from "@views/_index/index.view";

// The simulator is open to everybody (a guest by default); an account only synchronises the files
export const routes: Routes = [
  {
    path: "",
    component: LayoutAuthComponent,
    children: [{ path: "", component: IndexView, pathMatch: "full" }],
  },
  // There is no admin area any more: old links go to the start page
  { path: "admin", redirectTo: "/", pathMatch: "full" },
  // The views of the simulator (loaded when needed)
  {
    path: "auth",
    component: LayoutAuthComponent,
    data: { breadcrumb: "Home" },
    loadChildren: () => import("@views/_auth/auth.routes").then((m) => m.authRoutes),
  },
  {
    path: "landing",
    loadChildren: () => import("@views/_landing/landing.routes").then((m) => m.landingRoutes),
  },
  {
    path: "account",
    loadChildren: () => import("@views/_account/account.routes").then((m) => m.accountRoutes),
  },
  { path: "**", component: PageNotFoundComponent },
];
