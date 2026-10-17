import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, type Data, type Event, NavigationEnd, Router } from "@angular/router";
import { Utils } from "@app/Utils";
import { TranslatePipe } from "@ngx-translate/core";
import { filter } from "rxjs/operators";

type MenuItem = {
  label: Data;
  url: string;
};

@Component({
  selector: "THUMDER-breadcrumb",
  templateUrl: "./breadcrumb.component.html",
  styleUrls: ["./breadcrumb.component.scss"],
  imports: [AsyncPipe, TranslatePipe],
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public menuItems!: MenuItem[];
  public menuItemsLoaded!: Promise<boolean>;

  constructor() {
    this.router.events
      .pipe(
        filter((event: Event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((_$event) => {
        this.menuItems = this.createBreadcrumbs(this.activatedRoute.root);
        this.menuItemsLoaded = Promise.resolve(true);
      });
  }

  /** The text of a step (BREADCRUMB.<name>: "File Manager" is BREADCRUMB.FILE_MANAGER) */
  public labelOf(item: MenuItem): string {
    const name = String(item.label.breadcrumb ?? "");
    return `BREADCRUMB.${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = "", breadcrumbs: MenuItem[] = []): MenuItem[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      if (child.snapshot !== undefined) {
        const routeURL: string = child.snapshot.url.map((segment) => segment.path).join("/");
        if (routeURL !== "") {
          url += `/${routeURL}`;
        }
        const label = child.snapshot.data;
        if (!Utils.isNullOrUndefined(label?.breadcrumb)) {
          breadcrumbs.push({ label, url });
        }
        return this.createBreadcrumbs(child, url, breadcrumbs);
      }
    }
    return breadcrumbs;
  }
}
