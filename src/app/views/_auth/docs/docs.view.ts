import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import { MarkdownComponent, MarkdownService } from "ngx-markdown";
import { ViewportScroller } from "@angular/common";
import { REGEX_IS_ABSOLUTE_HREF } from "../../../CONSTAST";

@Component({
  selector: 'app-docs',
  templateUrl: './docs.view.html',
  styleUrls: ['./docs.view.scss']
})
export class DocsView implements OnInit {

  @ViewChild('markdownComponentID', {static: false})
  private markdownComponentID: MarkdownComponent;
  private listenObj: any;

  constructor(private markdownService: MarkdownService,
              private scroller: ViewportScroller,
              private router: Router,
              private renderer: Renderer2) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  public onMarkdownLoad() {
    // because MarkdownComponent isn't 'compiled' the links don't use the angular router,
    // so I'll catch the link click events here and pass them to the router...
    if (this.markdownComponentID) {
      this.listenObj = this.renderer.listen(this.markdownComponentID.element.nativeElement, 'click', (e: Event) => {
        if (e.target && (e.target as any).tagName === 'A') {
          const el = (e.target as HTMLElement);
          const linkURL = el.getAttribute && el.getAttribute('href');
          if (linkURL && !REGEX_IS_ABSOLUTE_HREF.test(linkURL)) {
            e.preventDefault();
            const id = linkURL.replace('#', '');
            this.scrollToAnchor(id);
          }
        }
      });
    }
  }

  scrollToAnchor(scrollToAnchor: string) {
    this.scroller.scrollToAnchor(scrollToAnchor);
  }
}
