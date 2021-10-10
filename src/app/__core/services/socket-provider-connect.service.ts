import { Injectable, EventEmitter, Output } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Socket } from 'ngx-socket-io';
import { ToastrService } from "ngx-toastr";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SocketProviderConnectService {


  private connectSubject = new Subject();
  private publicMessageSubject = new Subject();
  private privateMessageSubject = new Subject();

  public connectObservable = this.connectSubject.asObservable();
  public publicMessageObservable = this.publicMessageSubject.asObservable();
  public privateMessageObservable = this.privateMessageSubject.asObservable();

  constructor(public socket: Socket,
              private translate: TranslateService,
              private toast: ToastrService) {

    this.socket.ioSocket.on('connect', () => {
      const connect = this.socket.connect();
      this.connectSubject.next(connect)
      if (connect.connected) {
        this.socket.ioSocket.on('message', (res) => {
          this.publicMessageSubject.next(res)
        })
        this.socket.ioSocket.on(this.socket.ioSocket.id, (res) => {
          this.privateMessageSubject.next(res)
        })
      }
    });

    this.socket.ioSocket.on('connect_error', async () => {
      const title_server_down_lang = await this.translate.get('TOAST.TITLE_SERVER_DOWN').toPromise()
      const message_server_down_lang = await this.translate.get('TOAST.MESSAGE_SERVER_DOWN').toPromise()
      this.toast.warning(message_server_down_lang, title_server_down_lang, DEFAULT_CONFIG_TOAST)
    });
    this.socket.ioSocket.on('connect_failed', err => SocketProviderConnectService.handleErrors(err));
    this.socket.ioSocket.on('disconnect', err => SocketProviderConnectService.handleErrors(err));
    this.socket.ioSocket.on('error', err => SocketProviderConnectService.handleErrors(err));
  }

  emitMessage(event = 'default', payload = {}) {
    this.socket.ioSocket.emit(event, payload);
  }

  private static handleErrors(err) {
    console.error(err)
  }
}
