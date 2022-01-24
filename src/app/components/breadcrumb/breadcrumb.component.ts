import { Component } from "@angular/core";
import { Router, Event, NavigationEnd, ActivatedRoute, Data } from "@angular/router";
import { filter } from "rxjs/operators";
import { Utils } from "../../Utils";

type MenuItem = {
  label: Data,
  url: string
};

@Component({
  selector:    "thumder-breadcrumb",
  templateUrl: "./breadcrumb.component.html",
  styleUrls:   [ "./breadcrumb.component.scss" ]
})
export class BreadcrumbComponent {
  public menuItems: MenuItem[];
  public menuItemsLoaded: Promise<boolean>;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
      .subscribe((_$event) => {
        this.menuItems = this.createBreadcrumbs(this.activatedRoute.root);
        this.menuItemsLoaded = Promise.resolve(true);
      });
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = "", breadcrumbs: MenuItem[] = []): MenuItem[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      if (child.snapshot != undefined) {
        const routeURL: string = child.snapshot.url.map(segment => segment.path).join("/");
        if (routeURL !== "") {
          url += `/${ routeURL }`;
        }
        const label = child.snapshot.data;
        if (!Utils.isNullOrUndefined(label)) {
          breadcrumbs.push({ label, url });
        }
        return this.createBreadcrumbs(child, url, breadcrumbs);
      }
    }
  }
}
