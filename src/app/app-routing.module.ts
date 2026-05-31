import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";
// components
import { MonacoEditorComponent } from "@components/monaco-editor/monaco-editor.component";
// _layouts
import { LayoutAdminComponent } from "@layout/admin/layout-admin.component";
import { LayoutAuthComponent } from "@layout/auth/layout-auth.component";
import { PageNotFoundComponent } from "@shared/components";
// Guards
import { AuthGuard } from "@shared/guard/auth.guard";
// Index view
import { IndexView } from "@views/_index/index.view";

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
    loadChildren: () => import("@views/_auth/auth.module").then((m) => m.AuthModule),
  },
  // _landing views
  {
    path: "landing",
    loadChildren: () => import("@views/_landing/landing.module").then((m) => m.LandingModule),
  },
  // _account views
  {
    path: "account",
    loadChildren: () => import("@views/_account/account.module").then((m) => m.AccountModule),
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
