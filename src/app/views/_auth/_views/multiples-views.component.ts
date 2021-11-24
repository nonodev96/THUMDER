import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'view-multiples-views',
  templateUrl: './multiples-views.component.html',
  styleUrls: []
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit {

  constructor() {
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
