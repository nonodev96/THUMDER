import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { BreadcrumbComponent } from "@components/breadcrumb/breadcrumb.component";
import { PageService } from "@core/services/layout/page.service";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The header of a page: the name of the view, with its icon, and what it is for in one sentence (to learn where to
 * look), and where it is (the breadcrumb). On a phone the name is in the navbar: only the sentence stays
 */
@Component({
  selector: "THUMDER-page-header",
  templateUrl: "./page-header.component.html",
  styleUrls: ["./page-header.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BreadcrumbComponent, TranslatePipe],
})
export class PageHeaderComponent {
  public readonly page = inject(PageService).page;
}
