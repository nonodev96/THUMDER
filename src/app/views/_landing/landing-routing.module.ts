import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingView } from "./landing/landing.view";
import { AboutView } from "./about/about.view";
import { LayoutLandingComponent } from "../../_layouts/landing/layout-landing.component";

const routes: Routes = [
  {
    path:      "",
    component: LayoutLandingComponent,
    children:  [
      { path: "landing", component: LandingView, data: { breadcrumb: "Landing" } },
      { path: "about", component: AboutView, data: { breadcrumb: "About" } },

      { path: "**", redirectTo: "about" },
    ]
  }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class LandingRoutingModule {
}
