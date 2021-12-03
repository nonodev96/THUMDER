import { Component, OnInit } from '@angular/core';
import { TypeFloatingPointStageConfiguration, TypeMultiviewConfiguration } from "../../../types";
import { StorageService } from "../../../__core/storage/storage.service";
import {
  DEFAULT_AUTO_SAVE,
  DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION,
  DEFAULT_MEMORY_SIZE, DEFAULT_MULTIVIEW_CONFIGURATION,
  DEFAULT_TIME_SIMULATION
} from "../../../CONSTAST";
import { MachineService } from "../../../__core/machine/machine.service";

interface EventTargetInput extends EventTarget {
  value: string | number | boolean;
}

@Component({
  selector: 'view-config',
  templateUrl: './config.view.html',
  styleUrls: []
})
export class ConfigView implements OnInit {

  multiviewConfiguration: TypeMultiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
  floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  memorySize: number;
  timeSimulation: number;
  autoSave: boolean;

  constructor(private storage: StorageService,
              private machine: MachineService) {
    this.multiviewConfiguration = this.storage.getItem('multiview_configuration');
    this.floatingPointStageConfiguration = this.storage.getItem('floating_point_stage_configuration');
    this.memorySize = this.storage.getItem('memory_size');
    this.timeSimulation = this.storage.getItem('time_simulation');
    this.autoSave = this.storage.getItem('auto_save');
  }

  ngOnInit(): void {
    this.storage.watchStorage().subscribe((key) => {
      switch (key) {
        case 'floating_point_stage_configuration':
          this.floatingPointStageConfiguration = this.storage.getItem('floating_point_stage_configuration');
          break;
        case 'memory_size':
          this.memorySize = this.storage.getItem('memory_size');
          break;
        case 'time_simulation':
          this.timeSimulation = this.storage.getItem('time_simulation');
          break;
        case 'auto_save':
          this.autoSave = this.storage.getItem('auto_save');
          break;
        case 'multiview_configuration':
          this.multiviewConfiguration = this.storage.getItem('multiview_configuration');
          break;
      }
    });
  }

  async updateConfiguration(): Promise<void> {
    this.storage.setItem('multiview_configuration', this.multiviewConfiguration);
    this.storage.setItem('floating_point_stage_configuration', this.floatingPointStageConfiguration);
    this.storage.setItem('memory_size', this.memorySize);
    this.storage.setItem('time_simulation', this.timeSimulation);
    this.storage.setItem('auto_save', this.autoSave);
    await this.machine.resetMachineStatus();
    return Promise.resolve();
  }

  async resetConfiguration(): Promise<void> {
    this.storage.setItem('multiview_configuration', DEFAULT_MULTIVIEW_CONFIGURATION);
    this.storage.setItem('floating_point_stage_configuration', DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION);
    this.storage.setItem('memory_size', DEFAULT_MEMORY_SIZE);
    this.storage.setItem('time_simulation', DEFAULT_TIME_SIMULATION);
    this.storage.setItem('auto_save', DEFAULT_AUTO_SAVE);
    await this.machine.resetMachineStatus();
    return Promise.resolve();
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
    this.autoSave = target.checked ?? false;
  }

  updateTimeSimulation(target: EventTargetInput | any) {
    this.timeSimulation = parseInt(target.value.toString());
  }

  updateMultiviewConfig(target: EventTarget | any) {

  }
}
