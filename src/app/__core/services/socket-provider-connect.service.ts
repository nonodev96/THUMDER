import { Injectable, EventEmitter, Output } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Socket } from 'ngx-socket-io';
import { ToastrService } from "ngx-toastr";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { Subject } from "rxjs";
import firebase from "firebase";
import functions = firebase.functions;

@Injectable({
  providedIn: 'root'
})
export class SocketProviderConnectService {
  public socketID: string;
  private connect$ = new Subject();
  private publicMessage$ = new Subject();
  private privateMessage$ = new Subject();

  public connectObservable = this.connect$.asObservable();
  public publicMessageObservable = this.publicMessage$.asObservable();
  public privateMessageObservable = this.privateMessage$.asObservable();

  /**
   * TODO
   * https://www.tutorialspoint.com/socket.io/socket.io_error_handling.htm
   */

  constructor(public socket: Socket,
              private translate: TranslateService,
              private toast: ToastrService) {

    // When the client successfully connects.
    this.socket.ioSocket.on('connect', () => {
      const connect = this.socket.connect();
      this.socketID = this.socket.ioSocket.id;
      this.connect$.next(connect);
      if (connect.connected) {
        this.socket.ioSocket.on(this.socket.ioSocket.id, (res) => {
          this.privateMessage$.next(res);
        });
      }
    });
    // When the client is in the process of connecting.
    this.socket.ioSocket.on('connecting', () => {
      console.debug('WebSocket-connecting');

    });
    // When the client is disconnected.
    this.socket.ioSocket.on('disconnect', () => {
      console.debug('WebSocket-disconnect');
    });
    // When the connection to the server fails.
    this.socket.ioSocket.on('connect_failed', (err) => {
      console.debug('WebSocket-connect_failed');
      SocketProviderConnectService.handleErrors(err);
    });
    // An error event is sent from the server.
    this.socket.ioSocket.on('error', (err) => {
      console.debug('WebSocket-error');
      SocketProviderConnectService.handleErrors(err);
    });
    // When the server sends a message using the send function.
    this.socket.ioSocket.on('message', (data) => {
      console.debug('WebSocket-message');
      const title = this.translate.instant('WEBSOCKET.TITLE_NEW_MESSAGE');
      const message = this.translate.instant('WEBSOCKET.MESSAGE_NEW_MESSAGE', {type: 'message'});
      this.toast.info(title, message);
      this.publicMessage$.next(data);
    });
    // When reconnection to the server is successful.
    this.socket.ioSocket.on('reconnect', () => {
      console.debug('WebSocket-reconnect');

    });
    // When the client is in the process of connecting.
    this.socket.ioSocket.on('reconnecting', () => {
      console.debug('WebSocket-reconnecting');

    });
    // When the reconnection attempt fails.
    this.socket.ioSocket.on('reconnect_failed', (err) => {
      console.debug('WebSocket-reconnect_failed');
      SocketProviderConnectService.handleErrors(err);
    });

    this.socket.ioSocket.on('connect_error', (err) => {
      console.debug('WebSocket-connect_error');
      SocketProviderConnectService.handleErrors(err);
      const title = this.translate.instant('TOAST.TITLE_SERVER_DOWN');
      const message = this.translate.instant('TOAST.MESSAGE_SERVER_DOWN');
      this.toast.warning(message, title, DEFAULT_CONFIG_TOAST);
    });
  }

  public emitMessage(event = 'default', payload = {}, callback?: (...response) => void) {
    this.socket.ioSocket.emit(event, payload, callback);
  }

  private static handleErrors(err) {
    console.error(err);
  }
}
