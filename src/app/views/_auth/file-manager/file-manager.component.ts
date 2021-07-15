import { Component, OnInit } from '@angular/core';
import RemoteFileSystemProvider from "devextreme/file_management/remote_provider";

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit {
  remoteProvider: RemoteFileSystemProvider;
  imageItemToDisplay: any = {};
  popupVisible = false;

  constructor() {
    this.remoteProvider = new RemoteFileSystemProvider({
      endpointUrl: "https://js.devexpress.com/Demos/Mvc/api/file-manager-file-system-images",
    });
  }

  displayImagePopup(e) {
    this.imageItemToDisplay = e.file;
    this.popupVisible = true;
  }

  ngOnInit(): void {
  }

  height(): number | Function | string {
    return window.innerHeight / 1.25;
  }
}
