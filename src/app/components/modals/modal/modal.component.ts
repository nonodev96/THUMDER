import { Component, Input, type OnInit } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective, ModalOpenDirective } from "../../../__shared/directives/bootstrap/modal.directive";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.scss"],
  imports: [ModalOpenDirective, ModalDismissDirective, TranslatePipe],
})
export class ModalComponent implements OnInit {
  @Input() public modalID: string = "modal-id";
  @Input() public modalType: "" | "modal-sm" | "modal-lg" | "modal-xl" = "";
  @Input() public modalTitle: string = "MODAL.TITLE";
  @Input() public buttonSize: "" | "btn-xs" | "btn-sm" | "btn-lg" | "btn-xl" = "";
  @Input() public buttonText: string = "MODAL.TEXT";
  @Input() public buttonCloseText: string = "MODAL.CLOSE";
  @Input() public buttonSaveText: string = "MODAL.OK";

  ngOnInit(): void {}
}
