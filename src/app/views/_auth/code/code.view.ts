import { ChangeDetectionStrategy, Component, computed, inject, signal, untracked } from "@angular/core";
import type { TypeAddress, TypeInstructionsData_Table } from "@app/Types";
import { Utils } from "@app/Utils";
import { MachineService } from "@core/machine/machine.service";
import { bitsToHex, toAddress } from "@core/numbers";
import { TranslatePipe } from "@ngx-translate/core";
import { VirtualTableColumnDirective, VirtualTableComponent } from "@shared/components/virtual-table/virtual-table.component";
import { FromBaseToBasePipe } from "@shared/pipes/numbers/numbers.pipes";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-code",
  templateUrl: "./code.view.html",
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, VirtualTableComponent, VirtualTableColumnDirective, TranslatePipe, FromBaseToBasePipe],
})
export class CodeView {
  machine = inject(MachineService);

  public displayedColumnsMemory: string[] = ["Address", "Text", "Binary", "Hexadecimal", "Stage", "Instruction"];
  public maxHeightCard: string = "75vh";

  /** Where each instruction is in this cycle (one Map for the whole table, instead of a search for each row) */
  public readonly stages = this.machine.state.stages;

  /** The button of the card reads the memory again (a word written by the user in the memory view, for example) */
  private readonly refreshes = signal(0);

  /**
   * The rows: every word of the memory with its instruction. They change when a program is loaded (in one go, not row by
   * row); the stages of the pipeline change every cycle and only touch the classes of the rows
   */
  public readonly rows = computed<TypeInstructionsData_Table[]>(() => {
    this.machine.state.loads();
    this.refreshes();
    const code = new Map(this.machine.state.code().map((instruction) => [instruction.address.toUpperCase(), instruction]));
    return untracked(() => this.machine.memory.getAllMemoryWord()).map((word, index) => {
      const address = toAddress(index * 4);
      const hexCode = `0x${bitsToHex(word.binary, 8)}`;
      const instruction = code.get(address.toUpperCase());
      return {
        index,
        row: index,
        address,
        code: instruction?.code ?? hexCode,
        text: instruction?.text ?? "",
        instruction:
          instruction?.instruction ?? (instruction ? Utils.convertHexCodeToTextMachineInstructionDLX(instruction.code, index * 4) : ""),
        stage: "",
      } as TypeInstructionsData_Table;
    });
  });

  public readonly trackByIndex = (index: number) => index;

  /** The class of a row: the stage of its instruction */
  public readonly rowClass = (row: TypeInstructionsData_Table) => this.stageClass(row.address);

  public refresh(): void {
    this.refreshes.update((n) => n + 1);
  }

  /** The class of a row: the stage of its instruction (the floating point units, as intEX) */
  public stageClass(address: TypeAddress): string {
    const stage = this.stages().get(address);
    if (stage === undefined || stage === "") return "";
    return ["faddEX", "fmultEX", "fdivEX"].includes(stage) ? "stage-intEX" : `stage-${stage}`;
  }

  /** The height of the table when its card unfolds, is restored or fills the screen (it measures itself: ViewportResizeDirective) */
  public resizeCard(height: string): void {
    this.maxHeightCard = height;
  }
}
