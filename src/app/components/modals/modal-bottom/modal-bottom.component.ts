import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-modal-bottom',
  templateUrl: './modal-bottom.component.html',
  styleUrls: ['./modal-bottom.component.scss']
})
export class ModalBottomComponent implements OnInit {

  modalID: string = "modal-bottom-id";

  constructor() {
  }

  ngOnInit(): void {
  }

}
