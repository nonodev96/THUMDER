import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";

@Component({
  selector: "app-auth",
  templateUrl: "./layout-auth.component.html",
})
export class LayoutAuthComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document, private toast: ToastrService) {
  }

  ngOnInit(): void {
    this.document.body.className = "dx-viewport";
  }

  showToast() {
    const config: Partial<IndividualConfig> = {
      progressBar: true,
      progressAnimation: 'decreasing',
      closeButton: true
    }
    this.toast.success('Hello world!', 'Toastr fun!', config);
  }
}
