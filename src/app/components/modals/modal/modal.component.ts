import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector:    "app-modal",
  templateUrl: "./modal.component.html",
  styleUrls:   [ "./modal.component.scss" ]
})
export class ModalComponent implements OnInit {

  @Input() public modalID: string = "modal-id";
  @Input() public modalType: "" | "modal-sm" | "modal-lg" | "modal-xl" = "";
  @Input() public modalTitle: string = "MODAL.TITLE";
  @Input() public buttonSize: "" | "btn-xs" | "btn-sm" | "btn-lg" | "btn-xl" = "";
  @Input() public buttonText: string = "MODAL.TEXT";
  @Input() public buttonCloseText: string = "MODAL.CLOSE";
  @Input() public buttonSaveText: string = "MODAL.OK";

  constructor() {
  }

  ngOnInit(): void {
  }

}
