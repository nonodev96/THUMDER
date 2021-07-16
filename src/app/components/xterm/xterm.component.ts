import { OnInit, AfterViewInit, Component, Input, Output, ElementRef, ViewChild } from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { WebLinksAddon } from 'xterm-addon-web-links';
// import { LigaturesAddon } from 'xterm-addon-ligatures';
import { SearchAddon } from 'xterm-addon-search';
import { WebglAddon } from 'xterm-addon-webgl';
import { EventEmitter } from "events";

@Component({
  selector: 'thumder-xterm',
  templateUrl: './xterm.component.html',
  styleUrls: ['./xterm.component.scss']
})
export class XtermComponent implements OnInit, AfterViewInit {
  @ViewChild('myTerminal') terminalDiv: ElementRef;
  @Input() data = '';
  @Output() newEvent = new EventEmitter();

  terminal: Terminal;

  constructor() {
    this.terminal = new Terminal({
      theme: {background: '#090c0f'},
      bellStyle: 'sound',
      altClickMovesCursor: true
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.terminal.open(this.terminalDiv.nativeElement);
    // this.terminal.loadAddon(new AttachAddon());
    // this.terminal.loadAddon(new WebLinksAddon(handler));
    // this.terminal.loadAddon(new LigaturesAddon());
    this.terminal.loadAddon(new SearchAddon());
    this.terminal.loadAddon(new WebglAddon());

    this.terminal.writeln('Welcome to THUMDER\n')
    this.terminal.write('$ ');

    this.terminal.onKey((e) => {
      switch (e.domEvent.key) {
        case "Enter":
          this.terminal.writeln('');
          this.terminal.write('$ ');
          break;
        case "Backspace":
          this.terminal.write('\b \b');
          break;
        default:
          this.terminal.write(e.key);
      }
    });
  }

  write(text: string): void {
    this.terminal.writeln(text);
  }

}
