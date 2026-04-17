import { Component, type OnInit } from "@angular/core";

@Component({
  selector: "app-modal-bottom",
  templateUrl: "./modal-bottom.component.html",
  styleUrls: ["./modal-bottom.component.scss"],
  standalone: false,
})
export class ModalBottomComponent implements OnInit {
  modalID: string = "modal-bottom-id";

  ngOnInit(): void {}
}
