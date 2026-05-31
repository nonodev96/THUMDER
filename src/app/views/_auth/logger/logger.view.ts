import { Component, inject, type OnInit, ViewChild } from "@angular/core";
import type { TypeOnKeyEvent } from "@app/Types";
import { XtermComponent } from "@components/xterm/xterm.component";
import { MachineService } from "@core/machine/machine.service";

@Component({
  selector: "view-logger",
  templateUrl: "./logger.view.html",
  styleUrls: [],
  standalone: false,
})
export class LoggerView implements OnInit {
  machine = inject(MachineService);

  @ViewChild(XtermComponent)
  public xtermComponent!: XtermComponent;
  public text: string = "";

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  public onKey($event: TypeOnKeyEvent): void {
    console.log($event);
  }

  public test(): void {
    this.text = this.machine.logger;
  }
}
