import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { HomeModule } from "./home.module";
import { UtilityService } from "../core/utility.service";
import { AppComponent } from "../app.component";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {


  constructor(private router: Router, private util: AppComponent) {

  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {

  }

  log() {
    // console.log(this.editor.getModel().getValue())
  }

  getSelected() {
    // console.log(this.editor.getModel().getValueInRange(this.editor.getSelection()))
  }

}
