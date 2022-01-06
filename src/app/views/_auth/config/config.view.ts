import { Component, OnInit } from "@angular/core";
import {
  TypeFloatingPointStageConfiguration,
  TypeMultiviewConfiguration,
  TypeWebSocketConfiguration
} from "../../../types";
import { StorageService } from "../../../__core/storage/storage.service";
import {
  DEFAULT_AUTO_SAVE_CONFIGURATION,
  DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION,
  DEFAULT_MEMORY_SIZE_CONFIGURATION,
  DEFAULT_MULTIVIEW_CONFIGURATION,
  DEFAULT_TIME_SIMULATION_CONFIGURATION,
  DEFAULT_WEB_SOCKET_CONFIGURATION
} from "../../../CONSTAST";
import { MachineService } from "../../../__core/machine/machine.service";
import { AppConfig } from "../../../../environments/_environment";
import { SocketProviderConnectService } from "../../../__core/services/socket-provider-connect.service";

interface EventTargetInput extends EventTarget {
  value: string | number | boolean;
}

@Component({
  selector:    "view-config",
  templateUrl: "./config.view.html",
  styleUrls:   []
})
export class ConfigView implements OnInit {

  multiviewConfiguration: TypeMultiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
  floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  webSocketConfiguration: TypeWebSocketConfiguration = DEFAULT_WEB_SOCKET_CONFIGURATION;
  memorySizeConfiguration: number;
  timeSimulationConfiguration: number;
  autoSaveConfiguration: boolean;
  webSocketUrlIsEditable: boolean = AppConfig.readonly_web_socket_url;

  constructor(private storage: StorageService,
              private socket: SocketProviderConnectService,
              private machine: MachineService) {
    this.floatingPointStageConfiguration = this.storage.getItem("floating_point_stage_configuration");
    this.memorySizeConfiguration = this.storage.getItem("memory_size_configuration");
    this.timeSimulationConfiguration = this.storage.getItem("time_simulation_configuration");
    this.autoSaveConfiguration = this.storage.getItem("auto_save_configuration");
    this.multiviewConfiguration = this.storage.getItem("multiview_configuration");
    this.webSocketConfiguration = this.storage.getItem("web_socket_configuration");
  }

  ngOnInit(): void {
    this.storage.watchStorage().subscribe((key) => {
      switch (key) {
        case "floating_point_stage_configuration":
          this.floatingPointStageConfiguration = this.storage.getItem("floating_point_stage_configuration");
          break;
        case "memory_size_configuration":
          this.memorySizeConfiguration = this.storage.getItem("memory_size_configuration");
          break;
        case "time_simulation_configuration":
          this.timeSimulationConfiguration = this.storage.getItem("time_simulation_configuration");
          break;
        case "auto_save_configuration":
          this.autoSaveConfiguration = this.storage.getItem("auto_save_configuration");
          break;
        case "multiview_configuration":
          this.multiviewConfiguration = this.storage.getItem("multiview_configuration");
          break;
        case "web_socket_configuration":
          this.webSocketConfiguration = this.storage.getItem("web_socket_configuration");
          break;
      }
    });
  }

  async updateConfiguration(): Promise<void> {
    this.storage.setItem("multiview_configuration", this.multiviewConfiguration);
    this.storage.setItem("floating_point_stage_configuration", this.floatingPointStageConfiguration);
    this.storage.setItem("memory_size_configuration", this.memorySizeConfiguration);
    this.storage.setItem("time_simulation_configuration", this.timeSimulationConfiguration);
    this.storage.setItem("auto_save_configuration", this.autoSaveConfiguration);
    this.storage.setItem("web_socket_configuration", this.webSocketConfiguration);
    this.socket.updateSocketURl();
    await this.machine.resetMachineStatus();
    return Promise.resolve();
  }

  async resetConfiguration(): Promise<void> {
    this.floatingPointStageConfiguration = DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION;
    this.memorySizeConfiguration = DEFAULT_MEMORY_SIZE_CONFIGURATION;
    this.timeSimulationConfiguration = DEFAULT_TIME_SIMULATION_CONFIGURATION;
    this.autoSaveConfiguration = DEFAULT_AUTO_SAVE_CONFIGURATION;
    this.timeSimulationConfiguration = DEFAULT_TIME_SIMULATION_CONFIGURATION;
    this.multiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
    this.webSocketConfiguration = DEFAULT_WEB_SOCKET_CONFIGURATION;

    this.storage.setItem("multiview_configuration", DEFAULT_MULTIVIEW_CONFIGURATION);
    this.storage.setItem("floating_point_stage_configuration", DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION);
    this.storage.setItem("memory_size_configuration", DEFAULT_MEMORY_SIZE_CONFIGURATION);
    this.storage.setItem("time_simulation_configuration", DEFAULT_TIME_SIMULATION_CONFIGURATION);
    this.storage.setItem("auto_save_configuration", DEFAULT_AUTO_SAVE_CONFIGURATION);
    this.storage.setItem("web_socket_configuration", DEFAULT_WEB_SOCKET_CONFIGURATION);
    this.socket.updateSocketURl();
    await this.machine.resetMachineStatus();
    return Promise.resolve();
  }

  checkIfHttpUrlIsValid(url: EventTargetInput | any | string): boolean {
    const regex = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    return !!regex.test(url.value);
  }

  checkCount(target: EventTargetInput | any): void {
    const count = parseInt(target.value.toString());
    if (count >= 1 && count <= 8) {
      target.value = count;
    } else {
      target.value = 1;
    }
  }

  checkDelay(target: EventTargetInput | any): void {
    const delay = parseInt(target.value.toString());
    if (delay >= 1 && delay <= 50) {
      target.value = delay;
    } else {
      target.value = 1;
    }
  }

  checkMemorySize(target: EventTargetInput | any): void {
    const size = parseInt(target.value.toString());
    if (size >= 512 && size <= 1048576) {
      target.value = size;
    } else {
      target.value = 1;
    }
  }

  updateAutoSave(target: EventTargetInput | any) {
    this.autoSaveConfiguration = target.checked ?? false;
  }

  updateTimeSimulation(target: EventTargetInput | any) {
    this.timeSimulationConfiguration = parseInt(target.value.toString());
  }

  updateMultiviewConfig(target: EventTarget | any) {

  }
}
