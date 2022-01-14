import { Component, OnInit, Renderer2, ViewChild } from "@angular/core";
import { REGEX_IS_ABSOLUTE_HREF } from "../../../CONSTANTS";
import { MarkdownComponent, MarkdownService } from "ngx-markdown";
import { ViewportScroller } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-about",
  templateUrl: "./about.view.html",
  styleUrls: []
})
export class AboutView implements OnInit {
  @ViewChild("markdownComponentID_README", {static: false})
  private markdownComponentID_README: MarkdownComponent;

  @ViewChild("markdownComponentID_LICENSE", {static: false})
  private markdownComponentID_LICENSE: MarkdownComponent;

  @ViewChild("markdownComponentID_ABOUT", {static: false})
  private markdownComponentID_ABOUT: MarkdownComponent;

  @ViewChild("markdownComponentID_COOKIES", {static: false})
  private markdownComponentID_COOKIES: MarkdownComponent;

  @ViewChild("markdownComponentID_CHANGELOG", {static: false})
  private markdownComponentID_CHANGELOG: MarkdownComponent;

  private listenObj: any;

  constructor(private markdownService: MarkdownService,
              private scroller: ViewportScroller,
              private router: Router,
              private renderer: Renderer2) {
  }

  ngOnInit(): void {
  }

  public onMarkdownLoad(id: string) {
    let markdownComponent: MarkdownComponent;
    switch (id) {
      case "markdownComponentID_ABOUT":
        markdownComponent = this.markdownComponentID_ABOUT;
        break;
      case "markdownComponentID_LICENSE":
        markdownComponent = this.markdownComponentID_LICENSE;
        break;
      case "markdownComponentID_README":
        markdownComponent = this.markdownComponentID_README;
        break;
      case "markdownComponentID_COOKIES":
        markdownComponent = this.markdownComponentID_COOKIES;
        break;
      case "markdownComponentID_CHANGELOG":
        markdownComponent = this.markdownComponentID_CHANGELOG;
        break;
    }
    // because MarkdownComponent isn't 'compiled' the links don't use the angular router,
    // so I'll catch the link click events here and pass them to the router...
    if (markdownComponent) {
      this.listenObj = this.renderer.listen(markdownComponent.element.nativeElement, "click", (e: Event) => {
        if (e.target && (e.target as any).tagName === "A") {
          const el = (e.target as HTMLElement);
          const linkURL = el.getAttribute && el.getAttribute("href");
          if (linkURL && !REGEX_IS_ABSOLUTE_HREF.test(linkURL)) {
            e.preventDefault();
            const id = linkURL.replace("#", "");
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
