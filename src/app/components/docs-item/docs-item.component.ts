import { ViewportScroller } from "@angular/common";
import { Component, Input, inject, type OnInit, Renderer2, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { REGEX_IS_ABSOLUTE_HREF } from "@app/CONSTANTS";
import type { TypeIdTitleFile } from "@app/Types";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { type MarkdownComponent, MarkdownComponent as MarkdownComponent_1 } from "ngx-markdown";
import { CollapseDirective, CollapseToggleDirective } from "../../__shared/directives/bootstrap/collapse.directive";

@Component({
  selector: "THUMDER-docs-item",
  templateUrl: "./docs-item.component.html",
  styleUrls: [],
  imports: [CollapseToggleDirective, CollapseDirective, MarkdownComponent_1, TranslatePipe],
})
export class DocsItemComponent implements OnInit {
  private scroller = inject(ViewportScroller);
  private renderer = inject(Renderer2);
  private translate = inject(TranslateService);

  /** The language of the interface: a document in another one says so (I18N-04) */
  public readonly lang = signal(this.translate.getCurrentLang() ?? "es");

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => this.lang.set(event.lang));
  }

  @Input()
  public item!: TypeIdTitleFile;

  @ViewChild("markdownComponentID", { static: false })
  private markdownComponentID!: MarkdownComponent;

  private listenObj!: ReturnType<Renderer2["listen"]>;

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
