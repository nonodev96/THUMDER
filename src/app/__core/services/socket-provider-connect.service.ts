import { Injectable, EventEmitter, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Socket } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { Observable, Subject } from "rxjs";
import firebase from "firebase";
import functions = firebase.functions;

@Injectable({
  providedIn: "root"
})
export class SocketProviderConnectService {
  public socketID: string;
  private connect$ = new Subject<"Connect" | "Disconnect">();
  private publicMessage$ = new Subject();
  private privateMessage$ = new Subject();

  get connectObservable() {
    return this.connect$.asObservable();
  }

  get publicMessageObservable() {
    return this.publicMessage$.asObservable();
  }

  get privateMessageObservable() {
    return this.privateMessage$.asObservable();
  }

  /**
   * TODO
   * https://www.tutorialspoint.com/socket.io/socket.io_error_handling.htm
   */

  constructor(public socket: Socket,
              private translate: TranslateService,
              private toast: ToastrService) {

    // When the client successfully connects.
    this.socket.ioSocket.on("connect", () => {
      this.connect$.next("Connect");
      const connect = this.socket.connect();
      this.socketID = this.socket.ioSocket.id;
      if (connect.connected) {
        this.socket.ioSocket.on(this.socket.ioSocket.id, (res) => {
          this.privateMessage$.next(res);
        });
      }
    });
    // When the client is in the process of connecting.
    this.socket.ioSocket.on("connecting", () => {
      console.debug("WebSocket-connecting");

    });
    // When the client is disconnected.
    this.socket.ioSocket.on("disconnect", () => {
      this.connect$.next("Disconnect");
      console.debug("WebSocket-disconnect");
    });
    // When the connection to the server fails.
    this.socket.ioSocket.on("connect_failed", (err) => {
      console.debug("WebSocket-connect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    // An error event is sent from the server.
    this.socket.ioSocket.on("error", (err) => {
      console.debug("WebSocket-error");
      SocketProviderConnectService.handleErrors(err);
    });
    // When the server sends a message using the send function.
    // When reconnection to the server is successful.
    this.socket.ioSocket.on("reconnect", () => {
      this.connect$.next("Connect");
      console.debug("WebSocket-reconnect");
    });
    // When the client is in the process of connecting.
    this.socket.ioSocket.on("reconnecting", () => {
      console.debug("WebSocket-reconnecting");

    });
    // When the reconnection attempt fails.
    this.socket.ioSocket.on("reconnect_failed", (err) => {
      console.debug("WebSocket-reconnect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    this.socket.ioSocket.on("connect_error", async (err) => {
      console.debug("WebSocket-connect_error");
      SocketProviderConnectService.handleErrors(err);
      const title = await this.translate.get("TOAST.TITLE_SERVER_DOWN").toPromise();
      const message = await this.translate.get("TOAST.MESSAGE_SERVER_DOWN").toPromise();
      this.toast.warning(message, title, DEFAULT_CONFIG_TOAST);
    });
    this.socket.ioSocket.on("message", (data) => {
      console.debug("WebSocket-message");
      const title = this.translate.instant("WEBSOCKET.TITLE_NEW_MESSAGE");
      const message = this.translate.instant("WEBSOCKET.MESSAGE_NEW_MESSAGE", {type: "message"});
      this.toast.info(title, message);
      this.publicMessage$.next(data);
    });
  }

  public emitMessage(event = "default", payload = {}, callback?: (...response) => void) {
    this.socket.ioSocket.emit(event, payload, callback);
  }

  private static handleErrors(err) {
    console.error(err);
  }
}
