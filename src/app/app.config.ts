import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { type ApplicationConfig, ErrorHandler, inject, provideAppInitializer, SecurityContext } from "@angular/core";
import { getApp, initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, indexedDBLocalPersistence, initializeAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getRemoteConfig, provideRemoteConfig } from "@angular/fire/remote-config";
import { provideRouter } from "@angular/router";
import { routes } from "@app/app.routes";
import { FIREBASE_ENABLED } from "@app/CONSTANTS";
import { ErrorReporter, listenToWindowErrors, ThumderErrorHandler } from "@core/errors/error-reporter.service";
import { nativePlatform } from "@core/services/mobile/mobile";
import { UtilityService } from "@core/services/utility/utility.service";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { Parser, type Tokens } from "marked";
import { MARKED_OPTIONS, type MarkedOptions, MarkedRenderer, provideMarkdown } from "ngx-markdown";
import { AppConfig } from "../environments/_environment";

const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Where the animations of the wiki are (the wiki of THUMDER on GitHub) */
export const WIKI_ASSETS_URL = "https://raw.githubusercontent.com/wiki/nonodev96/THUMDER/wiki-assets/";

export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer({});

  renderer.table = (token: Tokens.Table) => {
    const parser = new Parser({});
    return parser.parse([token]).replace("<table>", "<table class='table table-striped'>");
  };

  renderer.blockquote = ({ tokens }) => {
    return '<blockquote class="blockquote"><p>' + Parser.parse(tokens) + "</p></blockquote>";
  };

  renderer.link = ({ href, title, tokens }: Tokens.Link): string => {
    // Renderizar los tokens internos a string
    const text = renderer.parser?.parseInline(tokens) ?? tokens.map((t) => ("text" in t ? t.text : "")).join("");
    const safeTitle = title ? ` title="${escapeAttribute(title)}"` : "";
    if (!href || /^\s*javascript:/i.test(href)) {
      return `<a${safeTitle}>${text}</a>`;
    }
    // Links to other sites open in a new tab (in Electron, in the browser of the system: see src-electron/main/window); the views
    // catch the clicks on the relative ones (DocsView, AboutView)
    const external = /^(https?:|mailto:)/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeAttribute(href)}"${safeTitle}${external}>${text}</a>`;
  };

  // The animations of the wiki (GIF, 116 MB) are not in the application (REN-06): they come from the wiki on GitHub.
  // The methods run with the renderer of marked as `this` (it has the parser): they call the originals with it
  const gif = (src: string) => src.replace(/^(?:\.\/)?wiki-assets\/([^/]+\.gif)$/i, (_, file) => `${WIKI_ASSETS_URL}${file}`);
  const image = renderer.image;
  renderer.image = function (this: MarkedRenderer, token: Tokens.Image): string {
    return image.call(this, { ...token, href: gif(token.href ?? "") });
  };
  // The wiki writes them in HTML too: <img src="./wiki-assets/...gif">
  const html = renderer.html;
  renderer.html = function (this: MarkedRenderer, token: Tokens.HTML | Tokens.Tag): string {
    return html.call(this, { ...token, text: token.text.replace(/src="([^"]+)"/gi, (_, src) => `src="${gif(src)}"`) });
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
  };
}

// Only with Firebase keys (FIREBASE_ENABLED); without them THUMDER works with a local guest and the files in the browser.
// Analytics starts only after the cookies are accepted (AppComponent)
const FIREBASE_PROVIDERS = FIREBASE_ENABLED
  ? [
      provideFirebaseApp(() => initializeApp(AppConfig.firebase)),
      // In the applications of Android and iOS the session is kept in IndexedDB, without the pop-ups and redirections
      // of the web (getAuth waits for them in the WebView of iOS); the sign-in with Google, GitHub and Apple is native
      provideAuth(() => (nativePlatform() !== null ? initializeAuth(getApp(), { persistence: indexedDBLocalPersistence }) : getAuth())),
      provideFirestore(() => getFirestore()),
      provideRemoteConfig(() => getRemoteConfig()),
    ]
  : [];

/** The providers of THUMDER (main.ts) */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideMarkdown({
      sanitize: SecurityContext.HTML,
      loader: HttpClient,
      markedOptions: { provide: MARKED_OPTIONS, useFactory: markedOptionsFactory },
    }),
    // The texts of src/assets/i18n, in Spanish when a text is missing in English
    provideTranslateService({ loader: provideTranslateHttpLoader({ prefix: "./assets/i18n/", suffix: ".json" }), fallbackLang: "es" }),
    UtilityService,
    ...FIREBASE_PROVIDERS,
    // The errors nobody catches, to Firestore (client-errors) in the production builds
    { provide: ErrorHandler, useClass: ThumderErrorHandler },
    provideAppInitializer(() => listenToWindowErrors(inject(ErrorReporter))),
  ],
};
