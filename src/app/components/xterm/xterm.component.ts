import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  SimpleChanges
} from "@angular/core";
import { Terminal } from "xterm";
import { SearchAddon } from "xterm-addon-search";
import { WebglAddon } from "xterm-addon-webgl";
import { TypeOnKeyEvent } from "../../Types";

@Component({
  selector:    "THUMDER-xterm",
  templateUrl: "./xterm.component.html",
  styleUrls:   ["./xterm.component.scss"]
})
export class XtermComponent implements OnInit, AfterViewInit {
  @ViewChild("myTerminal")
  public terminalDiv: ElementRef;

  @Input()
  public data = "";

  @Output()
  public onKey = new EventEmitter<TypeOnKeyEvent>();

  public terminal: Terminal;

  constructor() {
    this.terminal = new Terminal({
      theme:               { background: "#090c0f" },
      bellStyle:           "sound",
      altClickMovesCursor: true,
      cols:                120,
      rendererType:        "canvas"
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentValue = changes.data.currentValue;
    if (currentValue) {
      for (let i = 1; i < this.terminal.rows; i++) {
        this.terminal.scrollToLine(i);
        this.terminal.selectLines(i - 1, i);
        this.terminal.clearSelection();
      }
      this.terminal.write(currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.terminal.open(this.terminalDiv.nativeElement);

    // this.terminal.loadAddon(new AttachAddon());
    // this.terminal.loadAddon(new WebLinksAddon(handler));
    // this.terminal.loadAddon(new LigaturesAddon());
    this.terminal.loadAddon(new SearchAddon());
    this.terminal.loadAddon(new WebglAddon());

    //this.terminal.writeln(this.data)
    this.terminal.writeln("Welcome to THUMDER\n");
    this.terminal.write("$ ");

    this.terminal.onKey((e) => {
      switch (e.domEvent.key) {
        case "Enter":
          this.terminal.writeln("");
          this.terminal.write("$ ");
          break;
        case "Backspace":
          this.terminal.write("\b \b");
          break;
        default:
          this.terminal.write(e.key);
      }
      this.onKey.emit(e);
    });
  }

  public write(text: string): void {
    this.terminal.writeln(text);
  }

}
