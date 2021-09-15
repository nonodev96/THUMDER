import { Component, OnInit } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { Utils } from "../../Utils";
import { FileItem } from "../../__core/services/file-system-nonodev96/file-system.service";
import { SocketProviderConnectService } from "../../__core/services/socket-provider-connect.service";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";

@Component({
  selector: 'app-debug',
  templateUrl: './debug-view.html',
  styleUrls: ['./debug-view.scss']
})
export class DebugView implements OnInit {

  constructor(private toast: ToastrService,
              private socketProviderConnect: SocketProviderConnectService) {
    console.log("ioSocket: ", this.socketProviderConnect.socket.ioSocket)
  }

  ngOnInit(): void {
  }


  showToast() {
    this.toast.success('Hello world!', 'Toast fun!', DEFAULT_CONFIG_TOAST);
  }

  debugLocalStorage() {
    console.log(localStorage.getItem('FileSystem'));

    const documents = new FileItem('', true, []);
    documents.name = 'Documents';
    documents.key = Utils.uuidv4();
    const pepe = new FileItem('', false, []);
    pepe.name = 'pepe.s';
    pepe.key = Utils.uuidv4();

    const value = JSON.stringify({
      items: [documents, pepe]
    });
    localStorage.setItem('FileSystem', value)
  }

  debugSocket() {
    console.log(this.socketProviderConnect.socket.ioSocket)
  }

  debugLanguage(){

  }
}
