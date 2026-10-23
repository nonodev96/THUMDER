// What sign-in THUMDER offers where it runs, and when deleting an account needs to sign in again

export type SignInProvider = "google" | "github" | "apple";

export type SignInPlace = {
  platform: "web" | "desktop" | "android" | "ios";
  /** Android and iOS: the native sign-in is there (the application has the configuration of Firebase) */
  nativeAuth: boolean;
  /** Sign in with Apple is configured in Firebase (environment: signInWithApple) */
  apple: boolean;
};

/**
 * The providers of sign-in, besides email and password:
 * - in the web, Google and GitHub (pop-ups), and Apple when it is configured;
 * - in the desktop, none: Google does not sign in inside Electron;
 * - on Android and iOS, the native ones, only when the application has the configuration of Firebase (without it the
 *   native plugin does not load: docs/movil.md);
 * - on iOS, Google and GitHub only with Sign in with Apple next to them (guideline 4.8 of the App Store).
 */
export function signInProviders({ platform, nativeAuth, apple }: SignInPlace): SignInProvider[] {
  const withApple: SignInProvider[] = apple ? ["google", "github", "apple"] : ["google", "github"];
  switch (platform) {
    case "web":
      return withApple;
    case "desktop":
      return [];
    case "android":
      return nativeAuth ? withApple : [];
    case "ios":
      return nativeAuth && apple ? withApple : [];
  }
}

/** Firebase deletes an account only a few minutes after signing in (auth/requires-recent-login) */
export const RECENT_SIGN_IN_MS = 5 * 60 * 1000;

/** Whether the person signed in recently enough to delete the account (`lastSignInTime` of Firebase) */
export function signedInRecently(lastSignInTime: string | undefined, now: number): boolean {
  const time = Date.parse(lastSignInTime ?? "");
  return Number.isFinite(time) && now - time <= RECENT_SIGN_IN_MS;
}

/** The person closed the window of sign-in of the system: it is not an error */
export function isCancelled(error: unknown): boolean {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  return /cancel/i.test(`${code ?? ""} ${message ?? ""}`) || code === "auth/popup-closed-by-user";
}
