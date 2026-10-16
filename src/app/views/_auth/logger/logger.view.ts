import { Component, inject, type OnInit, ViewChild } from "@angular/core";
import type { TypeOnKeyEvent } from "@app/Types";
import { XtermComponent } from "@components/xterm/xterm.component";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { XtermComponent as XtermComponent_1 } from "../../../components/xterm/xterm.component";

@Component({
  selector: "view-logger",
  templateUrl: "./logger.view.html",
  styleUrls: [],
  imports: [CardDirective, CardWidgetDirective, XtermComponent_1, TranslatePipe],
})
export class LoggerView implements OnInit {
  machine = inject(MachineService);

  @ViewChild(XtermComponent)
  public xtermComponent!: XtermComponent;
  public text: string = "";

  ngOnInit(): void {}

  public onKey($event: TypeOnKeyEvent): void {
    logger.info($event);
  }

  public test(): void {
    this.text = this.machine.logger;
  }
}
