import { ViewportScroller } from "@angular/common";
import { Component, Input, inject, type OnInit, Renderer2, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { REGEX_IS_ABSOLUTE_HREF } from "@app/CONSTANTS";
import type { TypeIdTitleFile } from "@app/Types";
import { type MarkdownComponent, MarkdownService } from "ngx-markdown";

@Component({
  selector: "THUMDER-docs-item",
  templateUrl: "./docs-item.component.html",
  styleUrls: [],
  standalone: false,
})
export class DocsItemComponent implements OnInit {
  private scroller = inject(ViewportScroller);
  private renderer = inject(Renderer2);

  @Input()
  public item!: TypeIdTitleFile;

  @ViewChild("markdownComponentID", { static: false })
  private markdownComponentID!: MarkdownComponent;

  private listenObj!: ReturnType<Renderer2["listen"]>;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  public onMarkdownLoad(): void {
    if (this.markdownComponentID) {
      this.listenObj = this.renderer.listen(this.markdownComponentID.element.nativeElement, "click", (e: Event) => {
        if (e.target && (e.target as any).tagName === "A") {
          const el = e.target as HTMLElement;
          const linkURL = el.getAttribute?.("href");
          if (linkURL && !REGEX_IS_ABSOLUTE_HREF.test(linkURL)) {
            e.preventDefault();
            const id = linkURL.replace("#", "");
            this.scrollToAnchor(id);
          }
        }
      });
    }
  }

  private scrollToAnchor(scrollToAnchor: string): void {
    this.scroller.scrollToAnchor(scrollToAnchor);
  }
}
