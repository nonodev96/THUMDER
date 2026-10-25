import { ViewportScroller } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { type AfterViewInit, Component, inject, type OnInit, Renderer2, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterLink } from "@angular/router";
import { REGEX_IS_ABSOLUTE_HREF } from "@app/CONSTANTS";
import { logger } from "@core/logger/logger";
import { ElectronService } from "@core/services";
import { ConsentService } from "@core/services/consent/consent.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { type MarkdownComponent, MarkdownComponent as MarkdownComponent_1 } from "ngx-markdown";
import { firstValueFrom } from "rxjs";
import { CollapseDirective, CollapseToggleDirective } from "../../../__shared/directives/bootstrap/collapse.directive";
import { assetOf, type DocPage, pageById, pathOf, prepareMarkdown } from "../../_auth/docs/docs.catalog";

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
  private router = inject(Router);
  private translate = inject(TranslateService);

  /** The dependencies and their licences (scripts/licenses.mjs writes them when the project is installed) */
  public dependenciesData: LicenseInfo[] = [];
  public devDependenciesData: LicenseInfo[] = [];
  /** The README in the language of the application, without what only makes sense on GitHub (its badges) */
  public readme = signal("");
  /** The cards whose links are already caught */
  private listening = new Set<string>();

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => void this.loadReadme());
  }

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

  /** The README as the documentation shows it: its images where the build serves them and its links to the pages */
  private async loadReadme(): Promise<void> {
    const page = pageById("readme") as DocPage;
    const lang = this.translate.getCurrentLang() ?? "es";
    try {
      const markdown = await firstValueFrom(this.httpClient.get(assetOf(pathOf(page, lang)), { responseType: "text" }));
      this.readme.set(prepareMarkdown(markdown, page, lang));
    } catch (error) {
      logger.warn(error);
    }
  }

  private async prepareData(): Promise<void> {
    await this.loadReadme();
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
    if (this.listening.has(id)) return;
    this.listening.add(id);
    this.listenObj = this.renderer.listen(markdownComponent.element.nativeElement, "click", (e: Event) => {
      if (e.target && (e.target as any).tagName === "A") {
        const el = e.target as HTMLElement;
        const linkURL = el.getAttribute?.("href");
        // A page of the documentation (the links of the README)
        if (linkURL?.startsWith("/auth/documentation")) {
          e.preventDefault();
          void this.router.navigateByUrl(linkURL);
        } else if (linkURL && !REGEX_IS_ABSOLUTE_HREF.test(linkURL)) {
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
    await this.electronService.openInExternal(url);
  }
}
