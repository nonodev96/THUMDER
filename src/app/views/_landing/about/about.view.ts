import { ViewportScroller } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { type AfterViewInit, Component, inject, type OnInit, Renderer2, ViewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { REGEX_IS_ABSOLUTE_HREF } from "@app/CONSTANTS";
import { logger } from "@core/logger/logger";
import { ElectronService } from "@core/services";
import { ConsentService } from "@core/services/consent/consent.service";
import { TranslatePipe } from "@ngx-translate/core";
import { type MarkdownComponent, MarkdownComponent as MarkdownComponent_1 } from "ngx-markdown";
import { firstValueFrom } from "rxjs";
import { CollapseDirective, CollapseToggleDirective } from "../../../__shared/directives/bootstrap/collapse.directive";

type LicenseInfo = { name: string; version: string; license: string; author: string; homepage: string; description: string };

@Component({
  selector: "app-about",
  templateUrl: "./about.view.html",
  styleUrls: [],
  imports: [CollapseToggleDirective, CollapseDirective, MarkdownComponent_1, TranslatePipe, RouterLink],
})
export class AboutView implements OnInit, AfterViewInit {
  electronService = inject(ElectronService);
  consent = inject(ConsentService);
  private scroller = inject(ViewportScroller);
  private renderer = inject(Renderer2);
  private httpClient = inject(HttpClient);

  /** The dependencies and their licences (scripts/licenses.mjs writes them when the project is installed) */
  public dependenciesData: LicenseInfo[] = [];
  public devDependenciesData: LicenseInfo[] = [];

  @ViewChild("markdownComponentID_README", { static: false })
  private markdownComponentID_README!: MarkdownComponent;

  @ViewChild("markdownComponentID_LICENSE", { static: false })
  private markdownComponentID_LICENSE!: MarkdownComponent;

  @ViewChild("markdownComponentID_ABOUT", { static: false })
  private markdownComponentID_ABOUT!: MarkdownComponent;

  @ViewChild("markdownComponentID_CHANGELOG", { static: false })
  private markdownComponentID_CHANGELOG!: MarkdownComponent;

  private listenObj!: ReturnType<Renderer2["listen"]>;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.prepareData().then(() => {
      logger.info("End");
    });
  }

  private async prepareData(): Promise<void> {
    try {
      const licenses = await firstValueFrom(
        this.httpClient.get<{ dependencies: LicenseInfo[]; devDependencies: LicenseInfo[] }>("assets/licenses.json"),
      );
      this.dependenciesData = licenses.dependencies;
      this.devDependenciesData = licenses.devDependencies;
    } catch (error) {
      logger.warn(error);
    }
  }

  public onMarkdownLoad(id: string) {
    let markdownComponent: MarkdownComponent | null = null;
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
      case "markdownComponentID_CHANGELOG":
        markdownComponent = this.markdownComponentID_CHANGELOG;
        break;
    }
    // because MarkdownComponent isn't 'compiled' the links don't use the angular router,
    // so I'll catch the link click events here and pass them to the router...
    if (!markdownComponent) {
      logger.error("MarkdownComponent not found for id:", id);
      return;
    }
    this.listenObj = this.renderer.listen(markdownComponent.element.nativeElement, "click", (e: Event) => {
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

  scrollToAnchor(scrollToAnchor: string) {
    this.scroller.scrollToAnchor(scrollToAnchor);
  }

  public async openInExternal(url: string) {
    if (this.electronService.isElectronApp) {
      await this.electronService.openInExternal(url);
    } else {
      window.open(url, "_blank");
    }
  }
}
