import { Component, type OnInit } from "@angular/core";

@Component({
  selector: "THUMDER-footer-admin",
  templateUrl: "./footer-admin.component.html",
  standalone: false,
})
export class FooterAdminComponent implements OnInit {
  date = new Date().getFullYear();

  ngOnInit(): void {}
}
