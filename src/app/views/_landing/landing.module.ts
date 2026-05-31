import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AboutView } from "@views/_landing/about/about.view";
import { LandingView } from "@views/_landing/landing/landing.view";
import { LandingRoutingModule } from "@views/_landing/landing-routing.module";
import { MarkdownModule } from "ngx-markdown";

@NgModule({
  declarations: [AboutView, LandingView],
  imports: [CommonModule, LandingRoutingModule, TranslateModule, MarkdownModule],
})
export class LandingModule {}
