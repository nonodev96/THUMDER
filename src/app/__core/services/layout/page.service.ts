import { computed, Injectable, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Title } from "@angular/platform-browser";
import { NavigationEnd, Router } from "@angular/router";
import { AUTH_ROUTES } from "@app/CONSTANTS";
import { TranslateService } from "@ngx-translate/core";
import { filter, map, merge, startWith } from "rxjs";

/** The view that is open: its name (NAVIGATION.*), its icon and what it is for (PAGE_HELP.*) */
export type PageInfo = { key: string; title: string; icon: string; help: string };

const HOME: PageInfo = { key: "HOME", title: "HOME", icon: "fas fa-home", help: "PAGE_HELP.HOME" };
const OTHER: PageInfo = { key: "OTHER", title: "PAGES.HOME.TITLE", icon: "fas fa-microchip", help: "" };

/**
 * The view that is open, from the address: the header of the page, the title of the navbar on a phone and the title of
 * the tab of the browser («Pipeline | THUMDER») say which one it is and what it is for
 */
@Injectable({ providedIn: "root" })
export class PageService {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private title = inject(Title);

  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
      map((url) => url.split(/[?#]/)[0]),
    ),
    { initialValue: "/" },
  );

  public readonly page = computed<PageInfo>(() => {
    const path = this.path();
    if (path === "/" || path === "") return HOME;
    const entry = Object.entries(AUTH_ROUTES).find(([, route]) => route.routerLink === path);
    if (!entry) return OTHER;
    const [key, route] = entry;
    return { key, title: `NAVIGATION.${route.lang}`, icon: route.icon ?? "fas fa-microchip", help: `PAGE_HELP.${key}` };
  });

  constructor() {
    // The title of the tab, in the language of the interface
    merge(this.translate.onLangChange, this.router.events.pipe(filter((event) => event instanceof NavigationEnd))).subscribe(() =>
      this.updateTitle(),
    );
  }

  private updateTitle(): void {
    const page = this.page();
    const name = page === OTHER ? "" : this.translate.instant(page.title);
    this.title.setTitle(name && page !== HOME ? `${name} | THUMDER` : "THUMDER");
  }
}
