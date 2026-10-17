import { computed, Injectable, signal } from "@angular/core";

// What the user allows THUMDER to do besides what it needs to work (the privacy policy, /landing/privacy):
//   analytics  Google Analytics for Firebase, with its cookies (_ga, _ga_<id>): only if the user says yes (opt-in)
//   errors     the reports of the errors to Firestore (client-errors): no cookies and no personal data; on unless the
//              user turns them off
// The choice is kept in the browser (localStorage), with the version of the policy it answers: a new version asks again.

export type ConsentChoice = { analytics: boolean; errors: boolean };

type StoredConsent = ConsentChoice & { version: number; date: string };

export const CONSENT_KEY = "thumder_consent";

/** The version of the privacy policy: when what is asked changes, it goes up and the banner comes back */
export const CONSENT_VERSION = 1;

/** What the banner of cookieconsent (THUMDER 1.8 and before) kept */
const OLD_KEY = "cookieconsent";
const OLD_COOKIE = "cookieconsent_status";

function readCookie(name: string): string | null {
  const found = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

/** Deletes a cookie on this host and on the domains above it (the ones Google Analytics may use) */
export function deleteCookie(name: string): void {
  const parts = location.hostname.split(".");
  const domains = ["", ...parts.map((_, index) => parts.slice(index).join(".")).filter((domain) => domain.includes("."))];
  for (const domain of domains) {
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not in Firefox nor in older Safari
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
  }
}

/** The choice kept, or the one of the old banner (moved to the new key), or null if the user has not answered yet */
export function readConsent(storage: Storage = localStorage): StoredConsent | null {
  try {
    const stored = JSON.parse(storage.getItem(CONSENT_KEY) ?? "null") as StoredConsent | null;
    if (stored && stored.version === CONSENT_VERSION && typeof stored.analytics === "boolean" && typeof stored.errors === "boolean") {
      return stored;
    }
    const old = storage.getItem(OLD_KEY) ?? (typeof document === "undefined" ? null : readCookie(OLD_COOKIE));
    if (old === "allow" || old === "deny" || old === "dismiss") {
      const migrated: StoredConsent = {
        analytics: old === "allow",
        errors: true,
        version: CONSENT_VERSION,
        date: new Date().toISOString(),
      };
      storage.setItem(CONSENT_KEY, JSON.stringify(migrated));
      storage.removeItem(OLD_KEY);
      if (typeof document !== "undefined") deleteCookie(OLD_COOKIE);
      return migrated;
    }
  } catch {
    // Storage blocked or a value that is not JSON: as if there were no answer
  }
  return null;
}

@Injectable({ providedIn: "root" })
export class ConsentService {
  /** The web asks; the desktop application (file://) has no cookies nor analytics, and the user changes it in the footer */
  public readonly asks = location.protocol.startsWith("http");

  private readonly stored = signal<StoredConsent | null>(readConsent());

  /** Whether the user already answered (the banner is shown until then) */
  public readonly decided = computed(() => this.stored() !== null);
  public readonly analytics = computed(() => this.asks && (this.stored()?.analytics ?? false));
  public readonly errors = computed(() => this.stored()?.errors ?? true);

  /** The window of the settings (ConsentComponent) */
  public readonly settingsOpen = signal(false);

  public acceptAll(): void {
    this.save({ analytics: true, errors: true });
  }

  /** Only what THUMDER needs: no analytics, no reports */
  public rejectAll(): void {
    this.save({ analytics: false, errors: false });
  }

  public save(choice: ConsentChoice): void {
    const stored: StoredConsent = { ...choice, version: CONSENT_VERSION, date: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
    } catch {
      // Without storage the choice lasts until the page is closed
    }
    // Analytics off: its cookies go (the ones it already set)
    if (!choice.analytics)
      for (const name of document.cookie.split("; ").map((cookie) => cookie.split("=")[0])) if (name.startsWith("_ga")) deleteCookie(name);
    this.stored.set(stored);
    this.settingsOpen.set(false);
  }

  public openSettings(): void {
    this.settingsOpen.set(true);
  }

  public closeSettings(): void {
    this.settingsOpen.set(false);
  }
}
