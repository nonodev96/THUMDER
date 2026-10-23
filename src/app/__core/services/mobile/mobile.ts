// The applications of Android and iOS (Capacitor, src-mobile/): what they need decided without the native side, so it
// can be tested in the browser
import { Capacitor } from "@capacitor/core";

export type NativePlatform = "android" | "ios";

/** The site of THUMDER: its links of shared exercises open the application (App Links and Universal Links) */
export const WEB_ORIGIN = "https://thumder.netlify.app";

/** The application of Android or iOS where THUMDER runs, or null in the web and in the desktop */
export function nativePlatform(platform: string = Capacitor.getPlatform()): NativePlatform | null {
  return platform === "android" || platform === "ios" ? platform : null;
}

/** What is open on the page when the back button of Android is pressed */
export type BackState = {
  modal: boolean;
  dropdown: boolean;
  maximizedCard: boolean;
  /** The sidebar open over the content (phones and tablets) */
  sidebar: boolean;
  /** The page has somewhere to go back to */
  canGoBack: boolean;
};

export type BackAction = "close-modal" | "close-dropdown" | "restore-card" | "close-sidebar" | "go-back" | "leave";

/** What the back button does: it closes what is on top, then goes back a page and, at the start, leaves THUMDER */
export function backAction(state: BackState): BackAction {
  if (state.modal) return "close-modal";
  if (state.dropdown) return "close-dropdown";
  if (state.maximizedCard) return "restore-card";
  if (state.sidebar) return "close-sidebar";
  return state.canGoBack ? "go-back" : "leave";
}

/** A link that opens outside THUMDER, in the browser of the system: http(s) to another site */
export function isExternalLink(href: string, pageOrigin: string): boolean {
  try {
    const url = new URL(href, pageOrigin);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin !== pageOrigin;
  } catch {
    return false;
  }
}

/** The route of THUMDER of a link that opened the application (a shared exercise), or null if it is not one */
export function appRoute(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.origin !== WEB_ORIGIN || !url.pathname.startsWith("/auth/shared")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
