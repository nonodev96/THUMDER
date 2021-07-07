import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { MonacoEditorComponent } from "../components/monaco-editor/monaco-editor.component";
import { MonacoEditorModule } from "ngx-monaco-editor";
import { PipelinePixiComponent } from "../components/pipeline-pixi/pipeline-pixi.component";
import { XtermComponent } from "../components/xterm/xterm.component";

@NgModule({
  declarations: [
    HomeComponent,
    MonacoEditorComponent,
    PipelinePixiComponent,
    XtermComponent
  ],
  exports: [
    MonacoEditorComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    MonacoEditorModule
  ]
})
export class HomeModule {
}
