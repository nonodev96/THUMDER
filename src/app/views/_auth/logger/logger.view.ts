import { Component, type OnInit, ViewChild } from "@angular/core";
import { MachineService } from "@core/machine/machine.service";
import { XtermComponent } from "@components/xterm/xterm.component";
import type { TypeOnKeyEvent } from "@app/Types";

@Component({
  selector: "view-logger",
  templateUrl: "./logger.view.html",
  styleUrls: [],
  standalone: false,
})
export class LoggerView implements OnInit {
  @ViewChild(XtermComponent)
  public xtermComponent!: XtermComponent;
  public text: string = "";

  constructor(public machine: MachineService) {}

  ngOnInit(): void {}

  public onKey($event: TypeOnKeyEvent): void {
    console.log($event);
  }

  public test(): void {
    this.text = this.machine.logger;
  }
}
