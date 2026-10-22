import { DOCUMENT } from "@angular/common";
import { Component, computed, inject, type OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AUTH_ROUTES } from "@app/CONSTANTS";
import type { PublicRoutesList } from "@app/Types";
import { showsView } from "@core/engine/architectures";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { AppConfig } from "../../../environments/_environment";

type Item = { key: string; route: PublicRoutesList[string] };

const items = (...keys: string[]): Item[] =>
  keys.map((key) => ({ key, route: AUTH_ROUTES[key] })).filter((item) => item.route?.show !== false);

/**
 * The home page: how to start (write or open a program, load it, run it cycle by cycle) and every view by sections,
 * each one with what it is for. On a phone the views are a list
 */
@Component({
  selector: "app-index",
  templateUrl: "./index.view.html",
  styleUrls: ["./index.view.scss"],
  imports: [RouterLink, TranslatePipe],
})
export class IndexView implements OnInit {
  private _document = inject<Document>(DOCUMENT);

  private readonly machine = inject(MachineService);

  private readonly allSections: { title: string; items: Item[] }[] = [
    {
      title: "PAGES.INDEX.MACHINE",
      items: items("PIPELINE", "CYCLE_CLOCK_DIAGRAM", "DATAPATH", "REGISTERS", "MEMORY", "CODE", "STATISTICS"),
    },
    { title: "PAGES.INDEX.IDE", items: items("EDITOR", "FILE_MANAGER", "MULTIVIEW", "EXERCISES") },
    { title: "PAGES.INDEX.UTILS", items: items("CALCULATOR", "DOCUMENTATION", "CONFIG") },
    ...(AppConfig.environment === "DEV" ? [{ title: "PAGES.INDEX.DEBUG", items: items("LOGGER", "PROFILE") }] : []),
  ];

  /** The views of the architecture chosen (SuperDLX has no datapath) */
  public readonly sections = computed(() => {
    const architecture = this.machine.state.architecture();
    return this.allSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => showsView(architecture, item.route.path.replace(/-/g, "_"))),
    }));
  });

  /** The architecture simulated, for the home page */
  public readonly architecture = this.machine.state.architecture;

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
