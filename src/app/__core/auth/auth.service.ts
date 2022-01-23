import { Injectable, NgZone } from "@angular/core";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { Observable, Subject, Subscription } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import firebase from "firebase/app";
import UserCredential = firebase.auth.UserCredential;
import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";
import { InterfaceUser } from "../../Types";
import { ElectronService } from "../services";

@Injectable({
  providedIn: "root"
})

export class AuthService {
  public isLogging$: Subject<boolean> = new Subject<boolean>();

  public userData: InterfaceUser; // Save logged in user data
  private subscriptions$ = new Subscription();

  constructor(private afs: AngularFirestore,   // Inject Firestore service
              private afAuth: AngularFireAuth, // Inject Firebase auth service
              private ngZone: NgZone,          // NgZone service to remove outside scope warning
              private router: Router,
              private toast: ToastrService,
              private translate: TranslateService,
              private electronService: ElectronService) {
    this.subscriptions$.add(
      this.afAuth.authState.subscribe(user => {
        if (user) {
          window.document.body.className = "";
          window.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed");

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
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      await this.SetUserData(userCredential);
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
    }
    return Promise.resolve(false);
  }

  // Sign up with email/password
  public async SignUp(email, password): Promise<UserCredential | void> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      /* Call the SendVerificationMail(userCredential) function when new user sign
      up and returns promise */
      await this.SendVerificationMail(userCredential);
      await this.SetUserData(userCredential);
      return Promise.resolve(userCredential);
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
    }
    return Promise.resolve();
  }

  // Send email verification when new user sign up
  public async SendVerificationMail(userCredential: UserCredential): Promise<void> {
    try {
      await userCredential.user.sendEmailVerification();
      await this.router.navigate([ "/" ]);
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
    }
    return Promise.resolve();
  }

  // Reset Forgot password
  public async ForgotPassword(passwordResetEmail): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(passwordResetEmail);
      this.displayMessage("Email send, heck your inbox.");
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
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
    return this.AuthLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Sign in with Google
  async GithubAuth(): Promise<void> {
    return this.AuthLogin(new firebase.auth.GithubAuthProvider());
  }

  // Auth logic to run auth providers
  async AuthLoginAnonymously(): Promise<void> {
    try {
      const userCredential = await this.afAuth.signInAnonymously();
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate([ "/" ]);
      });
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
    }
    return Promise.resolve();
  }

  // Auth logic to run auth providers
  private async AuthLogin(provider): Promise<void> {
    try {
      const userCredential = await this.afAuth.signInWithPopup(provider);
      console.log(" AuthLogin");
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate([ "/" ]);
      });
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
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
      await this.router.navigate([ "/login" ]);
    } catch (error) {
      console.error(error);
      this.displayError(error as firebase.FirebaseError);
    }
  }

  /**
   * Si es la versión web esperamos una promesa por si se recibe los datos de un inicio de sesión
   */
  public async AuthCheckLoginRedirect(): Promise<boolean> {
    if (!this.electronService.isElectronApp) {
      const userCredential = await firebase.auth().getRedirectResult();
      if (userCredential.user !== null) {
        console.log("getRedirectResult", userCredential);
        await this.SetUserData(userCredential);
        this.ngZone.run(() => {
          this.router.navigate([ "/" ]);
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

  SetUserData(userCredential: UserCredential): any {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${ userCredential.user.uid }`);
    const userData: InterfaceUser = {
      uid:           userCredential.user.uid,
      email:         userCredential.user.email,
      displayName:   userCredential.user.displayName,
      photoURL:      userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified
    };
    return userRef.set(userData, {
      merge: true
    });
  }

  private displayMessage(message: string) {
    this.toast.info(message, "", DEFAULT_CONFIG_TOAST);
  }

  private displayError(error: firebase.FirebaseError) {
    const error_title = this.translate.instant("ERROR.TITLE", { title: error?.code ?? "" });
    const error_message = this.translate.instant("ERROR.MESSAGE", { message: error?.message ?? "" });
    this.toast.error(error_message, error_title, DEFAULT_CONFIG_TOAST);
  }
}
