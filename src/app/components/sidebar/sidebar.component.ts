import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
})
export class SidebarComponent implements OnInit {
  collapseShow = "hidden";

  constructor() {
  }

  ngOnInit(): void {
  }

  toggleCollapseShow(classes): void {
    this.collapseShow = classes;
  }
}
