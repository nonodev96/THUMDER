import { Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";
//import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
// import { AngularFireAuth } from '@angular/fire/compat/auth';

// import { Auth } from '@angular/fire/auth';
// import { setPersistence, inMemoryPersistence, browserSessionPersistence, Persistence, } from '@firebase/auth';

import { Observable, Subject, Subscription } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";

import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";
import { InterfaceUser } from "../../Types";
import { ElectronService } from "../services";
import { Firestore, doc, setDoc } from "@angular/fire/firestore";
import {
  Auth,
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  sendEmailVerification, sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInAnonymously, signInWithEmailAndPassword, signInWithPopup,
} from "@angular/fire/auth";
import { UserCredential } from "@angular/fire/auth";
import { FirebaseError } from "@angular/fire/app"


@Injectable({
  providedIn: "root"
})

export class AuthService {
  public isLogging$: Subject<boolean> = new Subject<boolean>();

  public userData: InterfaceUser; // Save logged in user data
  private subscriptions$ = new Subscription();

  constructor(private afs: Firestore,   // Inject Firestore service
              private afAuth: Auth, // Inject Firebase auth service
              private ngZone: NgZone,          // NgZone service to remove outside scope warning
              private router: Router,
              private toast: ToastrService,
              private translate: TranslateService,
              // private auth: Auth,
              private electronService: ElectronService) {
    this.subscriptions$.add(
      this.afAuth.onAuthStateChanged((user) => {
        if (user) {
          window.document.body.className = "";
          window.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");

          this.userData = user;
          localStorage.setItem("user", JSON.stringify(this.userData));
          // JSON.parse(localStorage.getItem("user"));
          this.isLogging$.next(true);
        } else {
          localStorage.setItem("user", null);
          // JSON.parse(localStorage.getItem("user"));
          this.isLogging$.next(false);
        }
      })
    );
  }

  ngOnInit(): void {
    // this.afAuth.auth.setPersistence('none')
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

  public getIsLoggingObservable(): Observable<boolean> {
    return this.isLogging$.asObservable();
  }

  // Sign in with email/password
  public async SignIn(email, password): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.afAuth, email, password);
      await this.SetUserData(userCredential);
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve(false);
  }

  // Sign up with email/password
  public async SignUp(email, password): Promise<UserCredential | void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.afAuth, email, password);
      await this.SendVerificationMail(userCredential);
      await this.SetUserData(userCredential);
      return Promise.resolve(userCredential);
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  // Send email verification when new user sign up
  public async SendVerificationMail(userCredential: UserCredential): Promise<void> {
    try {
      await sendEmailVerification(userCredential.user)
      await this.router.navigate(["/"]);
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  // Reset Forgot password
  public async ForgotPassword(passwordResetEmail): Promise<void> {
    try {
      await sendPasswordResetEmail(this.afAuth, passwordResetEmail);
      this.displayMessage("Email send, heck your inbox.");
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem("user"));
    return (user !== null /*&& user.emailVerified !== false*/);
  }

  // Sign in with Google
  async GoogleAuth(): Promise<void> {
    return this.AuthLogin(new GoogleAuthProvider());
  }

  // Sign in with Google
  async GithubAuth(): Promise<void> {
    return this.AuthLogin(new GithubAuthProvider());
  }

  // Auth logic to run auth providers
  async AuthLoginAnonymously(): Promise<void> {
    try {
      const userCredential = await signInAnonymously(this.afAuth);
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate(["/"]);
      });
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  // Auth logic to run auth providers
  private async AuthLogin(provider): Promise<void> {
    try {
      const userCredential = await signInWithPopup(this.afAuth, provider);
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate(["/"]);
      });
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
    return Promise.resolve();
  }

  public async SignOut() {
    try {
      await this.afAuth.signOut();
      localStorage.removeItem("user");
      for (const key of Object.keys(localStorage)) {
        localStorage.removeItem(key);
      }
      await this.router.navigate(["/account/login"]);
    } catch (error) {
      console.error(error);
      this.displayError(error);
    }
  }

  /**
   * Si es la versión web esperamos una promesa por si se recibe los datos de un inicio de sesión
   */
  public async AuthCheckLoginRedirect(): Promise<boolean> {
    if (!this.electronService.isElectronApp) {
      const userCredential = await getRedirectResult(this.afAuth);
      if (userCredential.user !== null) {
        // console.debug("getRedirectResult", userCredential);
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

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */

  SetUserData(userCredential: UserCredential) {
    const userRef = doc(this.afs, `users/${userCredential.user.uid}`);
    const userData: InterfaceUser = {
      uid:           userCredential.user.uid,
      email:         userCredential.user.email,
      displayName:   userCredential.user.displayName,
      photoURL:      userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified
    };
    return setDoc(userRef, userData);
  }

  private displayMessage(message: string) {
    this.toast.info(message, "", DEFAULT_CONFIG_TOAST);
  }

  private displayError(error: FirebaseError) {
    const error_title = this.translate.instant("ERROR.TITLE", { title: error?.code ?? "" });
    const error_message = this.translate.instant("ERROR.MESSAGE", { message: error?.message ?? "" });
    this.toast.error(error_message, error_title, DEFAULT_CONFIG_TOAST);
  }

  public async setPersistence(persistence: boolean): Promise<void> {
    // const type: Persistence = persistence ? browserSessionPersistence : inMemoryPersistence;
    // await setPersistence(this.auth, type);
  }
}
