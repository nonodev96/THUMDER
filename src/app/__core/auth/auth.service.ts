import { computed, Injectable, inject, NgZone, type OnDestroy, signal } from "@angular/core";
import {
  Auth,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
  type UserCredential,
} from "@angular/fire/auth";
import { doc, Firestore, setDoc } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { DEFAULT_CONFIG_TOAST, LOCAL_USER } from "@app/CONSTANTS";
import type { InterfaceUser } from "@app/Types";
import { logger } from "@core/logger/logger";
import { ElectronService } from "@core/services";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslateService } from "@ngx-translate/core";
import { type Observable, Subject, Subscription } from "rxjs";

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

  // Sign in with Google
  public async GoogleAuth(): Promise<void> {
    return this.AuthLogin(new GoogleAuthProvider());
  }

  // Sign in with Google
  public async GithubAuth(): Promise<void> {
    return this.AuthLogin(new GithubAuthProvider());
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

  private async AuthLogin(provider: any): Promise<void> {
    try {
      const userCredential = await signInWithPopup(this.auth, provider);
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

  /**
   * Signs out of the account: the files that are not in the account yet go to it, and then they leave this device with
   * the work of the person (on a shared computer the next one must not see it); the preferences stay. Without a
   * connection nothing is removed and the person is told
   */
  public async SignOut(): Promise<void> {
    if (this.afAuth === null || this.isGuest()) return;
    try {
      if (!(await this.files.disconnect())) {
        this.toast.warning(
          this.translate.instant("TOAST.MESSAGE_SYNC_PENDING"),
          this.translate.instant("TOAST.TITLE_SYNC"),
          DEFAULT_CONFIG_TOAST,
        );
        return;
      }
      for (const key of USER_DATA_KEYS) localStorage.removeItem(key);
      await this.afAuth.signOut();
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
    if (this.afAuth === null) return true;
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
    this.toast.info(message, "", DEFAULT_CONFIG_TOAST);
  }

  private displayError(error: unknown) {
    const err = error as { code?: string; message?: string };
    const error_title = this.translate.instant("ERROR.TITLE", { title: err?.code ?? "" });
    const error_message = this.translate.instant("ERROR.MESSAGE", { message: err?.message ?? "" });
    this.toast.error(error_message, error_title, DEFAULT_CONFIG_TOAST);
  }
}
