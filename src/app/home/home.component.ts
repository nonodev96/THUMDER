import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HomeModule } from "./home.module";
import { UtilityService } from "../core/utility.service";
import { AppComponent } from "../app.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router, private util: AppComponent) {
  }

  ngOnInit(): void {
  }

  change(): void {
    this.util.change('en');
  }
}
