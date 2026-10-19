import { ChangeDetectionStrategy, Component, Input, inject } from "@angular/core";
import { MachineService } from "@core/machine/machine.service";
import { SimulationControlsService } from "@core/services/simulation/simulation-controls.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

/**
 * The controls of the simulation, in the order of the work: load the code (and clear the machine), then go back, run or
 * pause, one cycle and run to the end. `bar`: icons in a group, for the navbar; `dock`: big buttons with their name
 * under the icon, for the bar at the bottom of a phone (where the thumb reaches), with «run» in the middle. Only one of
 * them is on the page at a time: their buttons keep the same titles and ids (the shortcuts say them)
 */
@Component({
  selector: "thumder-simulation-controls",
  templateUrl: "./simulation-controls.component.html",
  styleUrls: ["./simulation-controls.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  host: { "[class.dock]": "variant === 'dock'" },
})
export class SimulationControlsComponent {
  public machine = inject(MachineService);
  public controls = inject(SimulationControlsService);

  @Input() public variant: "bar" | "dock" = "bar";

  private translate = inject(TranslateService);

  /**
   * The name of a button for the screen readers: in the bar of a phone it starts with the name written under it (WCAG
   * 2.5.3, «Paso: Siguiente ciclo»), in the navbar it is the long one
   */
  public label(short: string, long: string): string {
    const name = this.translate.instant(long);
    return this.variant === "dock" ? `${this.translate.instant(short)}: ${name}` : name;
  }
}
