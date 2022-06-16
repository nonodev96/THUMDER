import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandingRoutingModule } from './landing-routing.module';

import { AboutView } from "./about/about.view";
import { LandingView } from "./landing/landing.view";
import { TranslateModule } from "@ngx-translate/core";
import { MarkdownModule } from "ngx-markdown";


@NgModule({
  declarations: [
    AboutView,
    LandingView
  ],
  imports: [
    CommonModule,
    LandingRoutingModule,
    TranslateModule,
    MarkdownModule
  ]
})
export class LandingModule { }
