import { Component, OnInit, ViewChild } from "@angular/core";
import { XtermComponent } from "../../../components/xterm/xterm.component";
import { TypeOnKeyEvent } from "../../../types";
import { MachineService } from "../../../__core/machine/machine.service";

@Component({
  selector: "view-logger",
  templateUrl: "./logger.view.html",
  styleUrls: []
})
export class LoggerView implements OnInit {

  @ViewChild(XtermComponent) xtermComponent: XtermComponent;
  text: string = "Hello";

  constructor(public machine: MachineService) {
  }

  ngOnInit(): void {
  }

  onKey($event: TypeOnKeyEvent): void {
    console.log($event);
  }

  test(): void {
    this.text = this.machine.logger;
  }
}
