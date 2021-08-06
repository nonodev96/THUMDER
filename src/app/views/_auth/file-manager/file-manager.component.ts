import {Component, Inject, OnInit} from '@angular/core';
import RemoteFileSystemProvider from "devextreme/file_management/remote_provider";
import {DOCUMENT} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit {
  remoteProvider: RemoteFileSystemProvider;
  imageItemToDisplay: any = {};
  popupVisible = false;

  fileItems = [{
    name: "Documents",
    isDirectory: true,
    items: [{
      name: "Projects",
      isDirectory: true,
      items: [{
        name: "About.rtf",
        isDirectory: false,
        size: 1024
      }, {
        name: "Passwords.rtf",
        isDirectory: false,
        size: 2048
      }]
    },{
      name: "About.xml",
      isDirectory: false,
      size: 1024
    }]
  }];

  constructor(@Inject(DOCUMENT) private document: Document, private router: Router) {
    this.remoteProvider = new RemoteFileSystemProvider({
      endpointUrl: "https://js.devexpress.com/Demos/Mvc/api/file-manager-file-system-images",
    });
  }

  onSelectedFileOpened($event) {
    this.imageItemToDisplay = $event.file;
    this.popupVisible = true;
    this.router.navigateByUrl('/auth/ide').then(r => {
      console.log(r)
    });
  }

  ngOnInit(): void {
    this.document.body.classList.add('login-page')
  }

  height(): number | Function | string {
    return window.innerHeight / 1.25;
  }

  onContextMenuItemClick($event: any) {
    console.log($event)
  }
}
