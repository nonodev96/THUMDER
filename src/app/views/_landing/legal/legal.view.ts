import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ConsentService } from "@core/services/consent/consent.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { MarkdownComponent } from "ngx-markdown";
import { map } from "rxjs";

export type LegalPage = "privacy" | "legal" | "accessibility" | "delete-account";

/**
 * The legal texts (src/assets/legal/<page>.<lang>.md): the privacy policy, the legal notice, the accessibility statement
 * and how to delete an account (the address Google Play asks for), with the way to do it from THUMDER
 */
@Component({
  selector: "view-legal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent, RouterLink, TranslatePipe],
  templateUrl: "./legal.view.html",
  styleUrl: "./legal.view.scss",
})
export class LegalView {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  public readonly consent = inject(ConsentService);
  public readonly auth = inject(AuthService);

  public readonly pages: { id: LegalPage; path: string; title: string }[] = [
    { id: "privacy", path: "/landing/privacy", title: "LEGAL.PRIVACY" },
    { id: "legal", path: "/landing/legal", title: "LEGAL.NOTICE" },
    { id: "accessibility", path: "/landing/accessibility", title: "LEGAL.ACCESSIBILITY" },
    { id: "delete-account", path: "/landing/delete-account", title: "LEGAL.DELETE_ACCOUNT" },
  ];

  public readonly page = toSignal(this.route.data.pipe(map((data) => data.page as LegalPage)), { initialValue: "privacy" as LegalPage });

  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es",
  });

  public readonly src = computed(() => `assets/legal/${this.page()}.${this.lang() === "en" ? "en" : "es"}.md`);

  public readonly failed = signal(false);
}
