import { Injectable, EventEmitter, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTAST";
import { Subject } from "rxjs";
// import { WrappedSocket } from "ngx-socket-io/src/socket-io.service";
// import { SocketIoConfig } from "ngx-socket-io/src/config/socket-io.config";
import { AppConfig } from "../../../environments/_environment";
import { StorageService } from "../storage/storage.service";
import { TypeWebSocketConfiguration } from "../../types";

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

  public socketIO: Socket;
  constructor(
              private translate: TranslateService,
              private toast: ToastrService) {
    console.log("constructor socket");
    const configWebSocket = JSON.parse(localStorage.getItem("web_socket_configuration")) as TypeWebSocketConfiguration;
    const config: SocketIoConfig = {
      url:     configWebSocket.socket_url,
      options: {
        transports:           ["websocket"],
        reconnection:         true,
        reconnectionDelay:    2000,
        reconnectionDelayMax: 2500,
        reconnectionAttempts: 5
      }
    };
    this.socketIO = new Socket(config);

    // When the client successfully connects.
    this.socketIO.ioSocket.on("connect", () => {
      this.connect$.next("Connect");
      const connect = this.socketIO.connect();
      this.socketID = this.socketIO.ioSocket.id;
      if (connect.connected) {
        this.socketIO.ioSocket.on(this.socketIO.ioSocket.id, (res) => {
          this.privateMessage$.next(res);
        });
      }
    });
    // When the client is in the process of connecting.
    this.socketIO.ioSocket.on("connecting", () => {
      console.debug("WebSocket-connecting");

    });
    // When the client is disconnected.
    this.socketIO.ioSocket.on("disconnect", () => {
      this.connect$.next("Disconnect");
      console.debug("WebSocket-disconnect");
    });
    // When the connection to the server fails.
    this.socketIO.ioSocket.on("connect_failed", (err) => {
      console.debug("WebSocket-connect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    // An error event is sent from the server.
    this.socketIO.ioSocket.on("error", (err) => {
      console.debug("WebSocket-error");
      SocketProviderConnectService.handleErrors(err);
    });
    // When the server sends a message using the send function.
    // When reconnection to the server is successful.
    this.socketIO.ioSocket.on("reconnect", () => {
      this.connect$.next("Connect");
      console.debug("WebSocket-reconnect");
    });
    // When the client is in the process of connecting.
    this.socketIO.ioSocket.on("reconnecting", () => {
      console.debug("WebSocket-reconnecting");
    });
    // When the reconnection attempt fails.
    this.socketIO.ioSocket.on("reconnect_failed", (err) => {
      console.debug("WebSocket-reconnect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    this.socketIO.ioSocket.on("connect_error", async (err) => {
      console.debug("WebSocket-connect_error");
      SocketProviderConnectService.handleErrors(err);
      const title = await this.translate.get("TOAST.TITLE_SERVER_DOWN").toPromise();
      const message = await this.translate.get("TOAST.MESSAGE_SERVER_DOWN").toPromise();
      this.toast.warning(message, title, DEFAULT_CONFIG_TOAST);
    });
    this.socketIO.ioSocket.on("message", (data) => {
      console.debug("WebSocket-message");
      const title = this.translate.instant("WEBSOCKET.TITLE_NEW_MESSAGE");
      const message = this.translate.instant("WEBSOCKET.MESSAGE_NEW_MESSAGE", {type: "message"});
      this.toast.info(title, message);
      this.publicMessage$.next(data);
    });
  }

  public updateSocketURl() {
    this.socketIO.disconnect();
    const configWebSocket = JSON.parse(localStorage.getItem("web_socket_configuration")) as TypeWebSocketConfiguration;
    const config: SocketIoConfig = {
      url:     configWebSocket.socket_url,
      options: {
        transports:           ["websocket"],
        reconnection:         true,
        reconnectionDelay:    2000,
        reconnectionDelayMax: 2500,
        reconnectionAttempts: 5
      }
    };
    this.socketIO = new Socket(config);
  }

  public emitMessage(event = "default", payload = {}, callback?: (...response) => void) {
    this.socketIO.ioSocket.emit(event, payload, callback);
  }

  private static handleErrors(err) {
    console.error(err);
  }
}
