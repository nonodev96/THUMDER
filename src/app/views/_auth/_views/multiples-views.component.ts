import { AfterViewInit, Component, OnInit } from '@angular/core';
import { TypeMultiviewConfiguration } from "../../../types";

@Component({
  selector: 'view-multiples-views',
  templateUrl: './multiples-views.component.html',
  styleUrls: []
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit {
  multiviewConfiguration: TypeMultiviewConfiguration;

  constructor() {
    this.multiviewConfiguration = JSON.parse(localStorage.getItem('multiview_configuration')) as TypeMultiviewConfiguration;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    MultiplesViewsComponent.closeAllCards();
  }

  private static closeAllCards() {
    window.jQuery('.card').CardWidget('collapse');
  }
}
