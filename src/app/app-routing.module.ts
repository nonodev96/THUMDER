import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";

import { PageNotFoundComponent } from "./__shared/components";
// Guards
import { AuthGuard } from "./__shared/guard/auth.guard";
// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";
// components
import { MonacoEditorComponent } from "./components/monaco-editor/monaco-editor.component";
// Index view
import { IndexView } from "./views/_index/index.view";

const routes: Routes = [
  {
    path: "",
    component: LayoutAuthComponent,
    canActivate: [AuthGuard],
    children: [{ path: "", component: IndexView, pathMatch: "full" }],
  },
  // _admin views
  {
    path: "admin",
    component: LayoutAdminComponent,
    children: [{ path: "", redirectTo: "/", pathMatch: "full" }],
  },
  // _auth views (lazy loaded)
  {
    path: "auth",
    component: LayoutAuthComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: "Home" },
    loadChildren: () => import("./views/_auth/auth.module").then((m) => m.AuthModule),
  },
  // _landing views
  {
    path: "landing",
    loadChildren: () => import("./views/_landing/landing.module").then((m) => m.LandingModule),
  },
  // _account views
  {
    path: "account",
    loadChildren: () => import("./views/_account/account.module").then((m) => m.AccountModule),
  },
  {
    path: "monaco",
    component: MonacoEditorComponent,
  },
  {
    path: "**",
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
