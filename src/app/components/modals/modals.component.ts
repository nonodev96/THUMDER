import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'thumder-modals',
  templateUrl: './modals.component.html',
  styleUrls: ['./modals.component.scss']
})
export class ModalsComponent implements OnInit {
  @ViewChild('modalContainer') modalContainer: ElementRef

  showModal = true;

  constructor() {
  }

  ngOnInit(): void {
  }


  toggleModal() {
    this.showModal = !this.showModal;
  }

  closeModal() {
    this.showModal = !this.showModal;
  }

  @HostListener('document:click', ['$event'])
  clickOut($event) {
    console.log($event)
    if (!this.modalContainer.nativeElement.contains($event.target)) {
      this.showModal = false;
    }
  }
}
