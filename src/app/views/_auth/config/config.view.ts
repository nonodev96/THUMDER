import { Component, OnInit } from '@angular/core';
import { TypeFloatingPointStageConfiguration } from "../../../types";
import { StorageService } from "../../../__core/storage/storage.service";
import { DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION, DEFAULT_MEMORY_SIZE } from "../../../CONSTAST";
import { MachineService } from "../../../__core/machine/machine.service";

interface EventTargetInput extends EventTarget {
  value: string | number;
}

@Component({
  selector: 'view-config',
  templateUrl: './config.view.html',
  styleUrls: []
})
export class ConfigView implements OnInit {

  floatingPointStageConfiguration: TypeFloatingPointStageConfiguration;
  memorySize: number;

  constructor(private storage: StorageService,
              private machine: MachineService) {
    this.floatingPointStageConfiguration = this.storage.getItem('floating_point_stage_configuration');
    this.memorySize = this.storage.getItem('memory_size');
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
      }
    })
  }

  async updateConfiguration() {
    this.storage.setItem('floating_point_stage_configuration', this.floatingPointStageConfiguration);
    this.storage.setItem('memory_size', this.memorySize);
    await this.machine.resetMachineStatus();
  }

  resetConfiguration() {
    this.storage.setItem('floating_point_stage_configuration', DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION);
    this.storage.setItem('memory_size', DEFAULT_MEMORY_SIZE);
  }

  checkCount(target: EventTargetInput | any) {
    const count = parseInt(target.value.toString())
    if (count >= 1 && count <= 8) {
      target.value = count;
    } else {
      target.value = 1;
    }
  }

  checkDelay(target: EventTargetInput | any) {
    const delay = parseInt(target.value.toString())
    if (delay >= 1 && delay <= 50) {
      target.value = delay;
    } else {
      target.value = 1;
    }
  }

  checkMemorySize(target: EventTargetInput | any) {
    const size = parseInt(target.value.toString())
    if (size >= 512 && size <= 1048576) {
      target.value = size;
    } else {
      target.value = 1;
    }
  }
}
