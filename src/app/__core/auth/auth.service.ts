import { computed, Injectable, inject, NgZone, type OnDestroy, signal } from "@angular/core";
import {
  Auth,
  type AuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
  type UserCredential,
} from "@angular/fire/auth";
import { deleteDoc, doc, Firestore, setDoc } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { LOCAL_USER } from "@app/CONSTANTS";
import type { InterfaceUser } from "@app/Types";
import { Capacitor } from "@capacitor/core";
import { logger } from "@core/logger/logger";
import { ElectronService } from "@core/services";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { nativePlatform } from "@core/services/mobile/mobile";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslateService } from "@ngx-translate/core";
import { type Observable, Subject, Subscription } from "rxjs";
import { AppConfig } from "../../../environments/_environment";
import { isCancelled, type SignInProvider, signedInRecently, signInProviders } from "./sign-in";

/** What signing out removes from localStorage: the work of the person (current file, breakpoints) and old sessions */
export const USER_DATA_KEYS = ["user", "UserCredential", "interfaceFileItem", "breakpoints"];

/**
 * Who uses THUMDER (DAT-01, DAT-06). Everybody can use the simulator as a guest, with the files in the browser; an
 * account (Firebase: Google, GitHub or email) only adds the synchronisation of the files between devices
 */
@Injectable({
  providedIn: "root",
})
export class AuthService implements OnDestroy {
  // Missing without Firebase keys (FIREBASE_ENABLED false): there are no accounts
  private afs = inject(Firestore, { optional: true });
  private afAuth = inject(Auth, { optional: true });
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private electronService = inject(ElectronService);
  private files = inject(FileSystemStorageService);

  public isLogging$: Subject<boolean> = new Subject<boolean>();

  /** The providers of sign-in of this platform, besides email and password (sign-in.ts) */
  public readonly providers: SignInProvider[] =
    this.afAuth === null
      ? []
      : signInProviders({
          platform: this.electronService.isElectronApp ? "desktop" : (nativePlatform() ?? "web"),
          nativeAuth: Capacitor.isPluginAvailable("FirebaseAuthentication"),
          apple: (AppConfig as { signInWithApple?: boolean }).signInWithApple === true,
        });

  private readonly userSignal = signal<InterfaceUser>(LOCAL_USER);
  /** The person: the account, or the guest (LOCAL_USER) */
  public readonly user = this.userSignal.asReadonly();
  public readonly isGuest = computed(() => this.userSignal().uid === LOCAL_USER.uid);
  private subscriptions$ = new Subscription();

  constructor() {
    AuthService.setLayoutClasses();
    // The session was kept in localStorage before: Firebase keeps it by itself
    localStorage.removeItem("user");
    localStorage.removeItem("UserCredential");
    if (this.afAuth === null) return;
    const unsubscribe = this.afAuth.onAuthStateChanged((user) => this.ngZone.run(() => this.setUser(user)));
    this.subscriptions$.add(unsubscribe);
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

  private setUser(user: User | null): void {
    if (user === null) {
      this.userSignal.set(LOCAL_USER);
      this.isLogging$.next(false);
      return;
    }
    this.userSignal.set(AuthService.toUser(user));
    this.isLogging$.next(true);
    // The files of this device and the ones of the account, together
    void this.files.connect(user.uid);
  }

  private static toUser(user: User): InterfaceUser {
    return {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      emailVerified: user.emailVerified,
    };
  }

  /** The person, as before the signals */
  public get userData(): InterfaceUser {
    return this.userSignal();
  }

  /** Everybody can use the simulator: as a guest or with an account */
  public get isLoggedIn(): boolean {
    return true;
  }

  /** Whether there are accounts (Firebase); in the local mode everybody is a guest */
  public get hasAccounts(): boolean {
    return this.afAuth !== null;
  }

  private get auth(): Auth {
    if (this.afAuth === null) throw new Error(this.translate.instant("TOAST.MESSAGE_NO_ACCOUNTS"));
    return this.afAuth;
  }

  // The classes of the layout of AdminLTE (the others, like dark-mode or the state of the sidebar, stay)
  private static setLayoutClasses() {
    window.document.body.classList.add("sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }

  public getIsLoggingObservable(): Observable<boolean> {
    return this.isLogging$.asObservable();
  }

  // Sign in with email/password
  public async SignIn(email: string, password: string): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.SetUserData(userCredential);
      return Promise.resolve(true);
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
    return Promise.resolve(false);
  }

  // Sign up with email/password
  public async SignUp(email: string, password: string): Promise<UserCredential | undefined> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.SendVerificationMail(userCredential);
      await this.SetUserData(userCredential);
      return Promise.resolve(userCredential);
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
    return Promise.resolve(undefined);
  }

  // Send email verification when new user sign up
  public async SendVerificationMail(userCredential: UserCredential): Promise<void> {
    try {
      await sendEmailVerification(userCredential.user);
      await this.router.navigate(["/"]);
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  // Reset Forgot password
  public async ForgotPassword(passwordResetEmail: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, passwordResetEmail);
      this.displayMessage(this.translate.instant("TOAST.MESSAGE_EMAIL_SENT"));
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  public async GoogleAuth(): Promise<void> {
    return this.signInWith("google");
  }

  public async GithubAuth(): Promise<void> {
    return this.signInWith("github");
  }

  public async AppleAuth(): Promise<void> {
    return this.signInWith("apple");
  }

  // Auth logic to run auth providers
  public async AuthLoginAnonymously(): Promise<void> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate(["/"]);
      });
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  /** Signs in with Google, GitHub or Apple: a pop-up in the web, the native sign-in on Android and iOS */
  private async signInWith(provider: SignInProvider): Promise<void> {
    try {
      const userCredential =
        nativePlatform() !== null ? await this.nativeSignIn(provider) : await signInWithPopup(this.auth, AuthService.webProvider(provider));
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate(["/"]);
      });
    } catch (error) {
      if (isCancelled(error)) return;
      logger.error(error);
      this.displayError(error);
    }
  }

  private static webProvider(provider: SignInProvider): AuthProvider {
    switch (provider) {
      case "google":
        return new GoogleAuthProvider();
      case "github":
        return new GithubAuthProvider();
      case "apple": {
        const apple = new OAuthProvider("apple.com");
        apple.addScope("email");
        apple.addScope("name");
        return apple;
      }
    }
  }

  /**
   * The native sign-in (@capacitor-firebase/authentication, with skipNativeAuth): the system signs in and gives the
   * credential, and the session is the one of the Firebase JavaScript SDK, so Firestore works as in the web
   */
  private async nativeSignIn(provider: SignInProvider): Promise<UserCredential> {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    switch (provider) {
      case "google": {
        const { credential } = await FirebaseAuthentication.signInWithGoogle();
        return signInWithCredential(this.auth, GoogleAuthProvider.credential(credential?.idToken, credential?.accessToken));
      }
      case "github": {
        const { credential } = await FirebaseAuthentication.signInWithGithub();
        return signInWithCredential(this.auth, GithubAuthProvider.credential(credential?.accessToken ?? ""));
      }
      case "apple": {
        const { credential } = await FirebaseAuthentication.signInWithApple();
        const apple = new OAuthProvider("apple.com").credential({ idToken: credential?.idToken, rawNonce: credential?.nonce });
        return signInWithCredential(this.auth, apple);
      }
    }
  }

  /** The native session too (the next sign-in asks again which account) */
  private async nativeSignOut(): Promise<void> {
    if (nativePlatform() === null || !Capacitor.isPluginAvailable("FirebaseAuthentication")) return;
    try {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      await FirebaseAuthentication.signOut();
    } catch (error) {
      logger.warn(error);
    }
  }

  /**
   * Signs out of the account: the files that are not in the account yet go to it, and then they leave this device with
   * the work of the person (on a shared computer the next one must not see it); the preferences stay. Without a
   * connection nothing is removed and the person is told
   */
  public async SignOut(): Promise<void> {
    if (this.afAuth === null || this.isGuest()) return;
    try {
      if (!(await this.files.disconnect())) {
        this.toast.warning(this.translate.instant("TOAST.MESSAGE_SYNC_PENDING"), this.translate.instant("TOAST.TITLE_SYNC"));
        return;
      }
      for (const key of USER_DATA_KEYS) localStorage.removeItem(key);
      await this.afAuth.signOut();
      await this.nativeSignOut();
      await this.router.navigate(["/"]);
    } catch (error) {
      logger.error(error);
      this.displayError(error);
    }
  }

  /**
   * Si es la versión web esperamos una promesa por si se recibe los datos de un inicio de sesión
   */
  public async AuthCheckLoginRedirect(): Promise<boolean> {
    // Without accounts, or on Android and iOS (native sign-in, without redirections)
    if (this.afAuth === null || nativePlatform() !== null) return true;
    if (!this.electronService.isElectronApp) {
      const userCredential = await getRedirectResult(this.auth);
      if (userCredential && userCredential.user !== null) {
        // logger.debug("getRedirectResult", userCredential);
        await this.SetUserData(userCredential);
        this.ngZone.run(() => {
          this.router.navigate(["/"]);
        });
      }
      return Promise.resolve(true);
    } else {
      return Promise.reject("Error you can't login in electron app");
    }
  }

  /**
   * Deletes the account, as Apple and Google Play ask for in the application: its files (in the account and on this
   * device), its profile and the account itself. Firebase only deletes an account a few minutes after signing in: if it
   * has been longer, nothing is deleted and the person has to sign in again ("sign-in-again")
   */
  public async DeleteAccount(): Promise<"deleted" | "sign-in-again" | "failed"> {
    const user = this.afAuth?.currentUser;
    if (!user || this.isGuest()) return "failed";
    if (!signedInRecently(user.metadata.lastSignInTime, Date.now())) return "sign-in-again";
    try {
      if (!(await this.files.deleteAccountFiles())) {
        this.toast.warning(this.translate.instant("TOAST.MESSAGE_ACCOUNT_NOT_DELETED"), this.translate.instant("TOAST.TITLE_SYNC"));
        return "failed";
      }
      if (this.afs !== null) await deleteDoc(doc(this.afs, `users/${user.uid}`));
      await deleteUser(user);
      await this.nativeSignOut();
      for (const key of USER_DATA_KEYS) localStorage.removeItem(key);
      this.toast.success(this.translate.instant("TOAST.MESSAGE_ACCOUNT_DELETED"));
      await this.router.navigate(["/"]);
      return "deleted";
    } catch (error) {
      if ((error as { code?: string })?.code === "auth/requires-recent-login") return "sign-in-again";
      logger.error(error);
      this.displayError(error);
      return "failed";
    }
  }

  private SetUserData(userCredential: UserCredential) {
    if (this.afs === null) return Promise.resolve();
    const userRef = doc(this.afs, `users/${userCredential.user.uid}`);
    const userData: InterfaceUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? "",
      displayName: userCredential.user.displayName ?? "",
      photoURL: userCredential.user.photoURL ?? "",
      emailVerified: userCredential.user.emailVerified,
    };
    return setDoc(userRef, userData);
  }

  private displayMessage(message: string) {
    this.toast.info(message, "");
  }

  private displayError(error: unknown) {
    const err = error as { code?: string; message?: string };
    const error_title = this.translate.instant("ERROR.TITLE", { title: err?.code ?? "" });
    const error_message = this.translate.instant("ERROR.MESSAGE", { message: err?.message ?? "" });
    this.toast.error(error_message, error_title);
  }
}
