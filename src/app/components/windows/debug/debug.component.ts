import { CdkDrag, CdkDragHandle } from "@angular/cdk/drag-drop";
import { Component, ElementRef, inject, type OnDestroy, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MachineService } from "@core/machine/machine.service";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "THUMDER-windows-debug",
  templateUrl: "./debug.component.html",
  styleUrls: ["./debug.component.scss"],
  imports: [CardDirective, CdkDrag, CdkDragHandle, CardWidgetDirective, TranslatePipe],
})
export class DebugComponent implements OnInit, OnDestroy {
  router = inject(Router);
  globals = inject(Globals);
  private machine = inject(MachineService);
  private element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  private loggerSubscription: Subscription = new Subscription();
  public private_logger: string[] = [];

  constructor() {
    this.loggerSubscription = this.machine.getLoggerObservable().subscribe((log) => {
      this.private_logger.push(log);
      // The last 100 lines (it removed the newest one, so the window stopped showing new lines)
      if (this.private_logger.length > 100) this.private_logger.shift();
      // After Angular draws the new line, down to it
      setTimeout(() => {
        const body = this.element.querySelector<HTMLElement>("#card-debug > .card-body");
        body?.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
      });
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.loggerSubscription.unsubscribe();
  }
}
