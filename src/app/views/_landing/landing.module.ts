import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { MarkdownModule } from "ngx-markdown";
import { AboutView } from "./about/about.view";
import { LandingView } from "./landing/landing.view";
import { LandingRoutingModule } from "./landing-routing.module";

@NgModule({
  declarations: [AboutView, LandingView],
  imports: [CommonModule, LandingRoutingModule, TranslateModule, MarkdownModule],
})
export class LandingModule {}
