import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Socket, type SocketIoConfig } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";
import { firstValueFrom, Subject } from "rxjs";
import { CONFIG_WEBSOCKET, DEFAULT_CONFIG_TOAST } from "../../../CONSTANTS";
import type { TypeWebSocketConfiguration } from "../../../Types";

@Injectable({
  providedIn: "root",
})
export class SocketProviderConnectService {
  public socketID!: string;
  private connect$ = new Subject<"Connect" | "Disconnect">();
  private publicMessage$ = new Subject();
  private privateMessage$ = new Subject();

  public socketIO: Socket;

  constructor(
    private translate: TranslateService,
    private toast: ToastrService,
  ) {
    const configWebSocket = JSON.parse(localStorage.getItem("web_socket_configuration") ?? "{}") as TypeWebSocketConfiguration;
    const config: SocketIoConfig = CONFIG_WEBSOCKET;
    config.url = configWebSocket.socket_url;
    this.socketIO = new Socket(config);

    // When the client successfully connects.
    this.socketIO.ioSocket.on("connect", async () => {
      this.connect$.next("Connect");
      const connect = this.socketIO.connect();
      this.socketID = this.socketIO.ioSocket.id;
      if (connect.connected) {
        this.socketIO.ioSocket.on(this.socketIO.ioSocket.id, (res: any) => {
          this.privateMessage$.next(res);
        });
      }
    });
    // When the client is in the process of connecting.
    this.socketIO.ioSocket.on("connecting", async () => {
      console.debug("WebSocket-connecting");
    });
    // When the client is disconnected.
    this.socketIO.ioSocket.on("disconnect", async () => {
      this.connect$.next("Disconnect");
      console.debug("WebSocket-disconnect");
    });
    // When the connection to the server fails.
    this.socketIO.ioSocket.on("connect_failed", async (err: any) => {
      console.debug("WebSocket-connect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    // An error event is sent from the server.
    this.socketIO.ioSocket.on("error", async (err: any) => {
      console.debug("WebSocket-error");
      SocketProviderConnectService.handleErrors(err);
    });
    // When the server sends a message using the send function.
    // When reconnection to the server is successful.
    this.socketIO.ioSocket.on("reconnect", async () => {
      this.connect$.next("Connect");
      console.debug("WebSocket-reconnect");
    });
    // When the client is in the process of connecting.
    this.socketIO.ioSocket.on("reconnecting", async () => {
      console.debug("WebSocket-reconnecting");
    });
    // When the reconnection attempt fails.
    this.socketIO.ioSocket.on("reconnect_failed", async (err: any) => {
      console.debug("WebSocket-reconnect_failed");
      SocketProviderConnectService.handleErrors(err);
    });
    this.socketIO.ioSocket.on("connect_error", async (_err: any) => {
      console.debug("WebSocket-connect_error");
      // SocketProviderConnectService.handleErrors(err);
      const title = await firstValueFrom(this.translate.get("TOAST.TITLE_SERVER_DOWN"));
      const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_SERVER_DOWN"));
      this.toast.warning(message, title, DEFAULT_CONFIG_TOAST);
    });
    this.socketIO.ioSocket.on("message", (data: any) => {
      console.debug("WebSocket-message");
      const title = this.translate.instant("WEBSOCKET.TITLE_NEW_MESSAGE");
      const message = this.translate.instant("WEBSOCKET.MESSAGE_NEW_MESSAGE", { type: "message" });
      this.toast.info(title, message);
      this.publicMessage$.next(data);
    });
  }

  public connectObservable() {
    return this.connect$.asObservable();
  }

  public updateSocketURl() {
    this.socketIO.disconnect();
    const configWebSocket = JSON.parse(localStorage.getItem("web_socket_configuration") ?? "{}") as TypeWebSocketConfiguration;
    const config: SocketIoConfig = CONFIG_WEBSOCKET;
    config.url = configWebSocket.socket_url;
    this.socketIO = new Socket(config);
  }

  public emitMessage(event = "default", payload = {}, callback?: (...response: any[]) => void) {
    this.socketIO.ioSocket.emit(event, payload, callback);
  }

  private static handleErrors(err: any) {
    console.error(err);
  }
}
