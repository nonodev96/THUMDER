import { HttpClient } from "@angular/common/http";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  Injector,
  inject,
  signal,
  untracked,
  ViewChild,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { logger } from "@core/logger/logger";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { MarkdownComponent } from "ngx-markdown";
import { firstValueFrom, map } from "rxjs";
import {
  assetOf,
  DOC_PAGES,
  DOC_SECTIONS,
  type DocLang,
  type DocPage,
  type DocSection,
  langOf,
  pageById,
  pathOf,
  prepareMarkdown,
  REPOSITORY,
  sectionOf,
  slug,
} from "./docs.catalog";
import { InstructionTableComponent } from "./instruction-table/instruction-table.component";

/**
 * The documentation: an index by parts (getting started, using THUMDER, learning DLX, the reference and how it is made)
 * and one page at a time, chosen with `?page=` (so a page has its own link), in the language of the application when it
 * is written in it. The links between pages and to the sections of a page work inside THUMDER; without a page, a summary
 * of the parts.
 */
@Component({
  selector: "view-docs",
  templateUrl: "./docs.view.html",
  styleUrls: ["./docs.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownComponent, TranslatePipe, InstructionTableComponent],
})
export class DocsView {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private injector = inject(Injector);

  @ViewChild("article") private article?: ElementRef<HTMLElement>;

  public readonly repository = REPOSITORY;
  public readonly allSections = DOC_SECTIONS;
  public readonly filter = signal("");
  public readonly lang = signal(this.translate.getCurrentLang() ?? "es");

  private readonly pageId = toSignal(this.route.queryParamMap.pipe(map((params) => params.get("page"))), { initialValue: null });
  public readonly current = computed(() => pageById(this.pageId()));
  public readonly section = computed(() => {
    const page = this.current();
    return page ? sectionOf(page) : null;
  });
  public readonly previous = computed(() => this.neighbour(-1));
  public readonly next = computed(() => this.neighbour(1));

  public readonly content = signal("");
  public readonly loading = signal(false);
  public readonly failed = signal(false);

  /** The parts with the pages whose title has what is written in the search */
  public readonly sections = computed<DocSection[]>(() => {
    const text = this.filter().trim().toLowerCase();
    if (!text) return DOC_SECTIONS;
    this.lang();
    return DOC_SECTIONS.map((section) => ({
      ...section,
      pages: section.pages.filter((page) => this.translate.instant(page.title).toLowerCase().includes(text)),
    })).filter((section) => section.pages.length > 0);
  });

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => this.lang.set(event.lang));
    effect(() => {
      const page = this.current();
      const lang = this.lang();
      if (!page) return;
      untracked(() => {
        // The link of a page that another one replaces: the address says the page that is shown
        if (page.id !== this.pageId()) this.replaceId(page);
        if (page.view) this.shown();
      });
      if (!page.view) void this.load(page, lang);
    });
  }

  /** The language the page is shown in (the pages that THUMDER draws are in the language of the application) */
  public shownLang(page: DocPage): DocLang {
    return langOf(page, this.lang());
  }

  /** The page is not written in the language of the application */
  public foreign(page: DocPage): boolean {
    return !page.view && this.shownLang(page) !== this.lang();
  }

  /** Where the page is on GitHub, in the language shown */
  public sourceOf(page: DocPage): string {
    return this.repository + (page.source ?? pathOf(page, this.lang()));
  }

  private replaceId(page: DocPage): void {
    const { queryParamMap, fragment } = this.route.snapshot;
    const queryParams: Record<string, string> = { page: page.id };
    for (const key of queryParamMap.keys) if (key !== "page") queryParams[key] = queryParamMap.get(key) as string;
    void this.router.navigate([], { relativeTo: this.route, queryParams, fragment: fragment ?? undefined, replaceUrl: true });
  }

  private neighbour(step: number): DocPage | null {
    const page = this.current();
    if (!page) return null;
    return DOC_PAGES[DOC_PAGES.indexOf(page) + step] ?? null;
  }

  private async load(page: DocPage, lang: string): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const markdown = await firstValueFrom(this.http.get(assetOf(pathOf(page, lang)), { responseType: "text" }));
      if (this.current() === page && this.lang() === lang) this.content.set(prepareMarkdown(markdown, page, lang));
    } catch (error) {
      logger.error(error);
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /** A page that THUMDER draws: its top is shown, unless the address names a part of it (?i=ADD) */
  private shown(): void {
    afterNextRender(
      () => {
        const { queryParamMap, fragment } = this.route.snapshot;
        if (!queryParamMap.has("i") && !fragment) this.article?.nativeElement.scrollIntoView({ block: "start" });
      },
      { injector: this.injector },
    );
  }

  /** The page is drawn: its headings get the ids of their links, and the section of the address is shown */
  public onReady(): void {
    const article = this.article?.nativeElement;
    if (!article) return;
    for (const heading of article.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")) {
      if (!heading.id) heading.id = slug(heading.textContent ?? "");
    }
    const fragment = this.route.snapshot.fragment;
    if (fragment) document.getElementById(fragment)?.scrollIntoView();
    else article.scrollIntoView({ block: "start" });
  }

  /** The links of a page: to another page or to a section of this one, inside THUMDER */
  public onClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!anchor || !href || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    if (href.startsWith("#")) {
      event.preventDefault();
      document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: "smooth" });
    } else if (href.startsWith("/auth/documentation")) {
      event.preventDefault();
      void this.router.navigateByUrl(href);
    } else if (/^https?:/.test(href)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  }

  /** The select of the index (on narrow screens) */
  public open(id: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: id ? { page: id } : {} });
  }
}
