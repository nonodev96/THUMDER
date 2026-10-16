import { EnvironmentInjector, type ErrorHandler, Injectable, inject, runInInjectionContext } from "@angular/core";
import { addDoc, collection, Firestore, serverTimestamp } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { NPM_VERSION } from "@app/CONSTANTS";
import { logger } from "@core/logger/logger";
import * as env from "../../../environments/_environment";
import { ERRORS_COLLECTION, errorKey, errorReport } from "./error-report";

/** At most this many errors of a page are sent (the same one, once) */
const MAX_REPORTS = 10;

/**
 * The errors nobody catches go to Firestore (client-errors), to see them in the console of Firebase: Crashlytics has no
 * web nor Electron version. Only the production builds with Firebase send them (not the development ones, nor the tests).
 */
@Injectable({ providedIn: "root" })
export class ErrorReporter {
  private readonly firestore = inject(Firestore, { optional: true });
  private readonly injector = inject(EnvironmentInjector);
  private readonly router = inject(Router);
  private readonly sent = new Set<string>();

  public get enabled(): boolean {
    return this.firestore !== null && env.AppConfig.production;
  }

  public report(error: unknown): void {
    const firestore = this.firestore;
    if (firestore === null || !this.enabled) return;
    const report = errorReport(error, {
      path: this.router.url,
      version: NPM_VERSION,
      userAgent: navigator.userAgent,
      lang: document.documentElement.lang || navigator.language,
    });
    const key = errorKey(report);
    if (this.sent.has(key) || this.sent.size >= MAX_REPORTS) return;
    this.sent.add(key);
    runInInjectionContext(this.injector, () =>
      addDoc(collection(firestore, ERRORS_COLLECTION), { ...report, createdAt: serverTimestamp() }),
    ).catch(
      // Without connection, or blocked: it is not reported again (no loops)
      (failure) => logger.warn("The error could not be reported", failure),
    );
  }
}

/** The errors Angular catches: in the console, as before, and reported */
@Injectable()
export class ThumderErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReporter);

  public handleError(error: unknown): void {
    logger.error(error);
    this.reporter.report(error);
  }
}

/** The errors outside Angular (scripts, promises without catch) */
export function listenToWindowErrors(reporter: ErrorReporter): void {
  window.addEventListener("error", (event) => reporter.report(event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => reporter.report(event.reason));
}
