import { Injectable, NgZone, OnDestroy, OnInit } from '@angular/core';
import { InterfaceUser } from "../../types";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { ElectronService } from "../services";
import { Router } from "@angular/router";
import { Observable, Subject, Subscription } from "rxjs";
import firebase from 'firebase/app';
import UserCredential = firebase.auth.UserCredential;

@Injectable({
  providedIn: 'root'
})

export class AuthService implements OnInit, OnDestroy {
  public isLogging$: Subject<boolean> = new Subject<boolean>();

  public userData: InterfaceUser; // Save logged in user data
  private subscriptions$ = new Subscription();

  constructor(public afs: AngularFirestore,   // Inject Firestore service
              public afAuth: AngularFireAuth, // Inject Firebase auth service
              public ngZone: NgZone,          // NgZone service to remove outside scope warning
              public router: Router,
              public electronService: ElectronService) {
    this.subscriptions$.add(
      this.afAuth.authState.subscribe(user => {
        if (user) {
          window.document.body.className = "";
          this.userData = user;
          localStorage.setItem('user', JSON.stringify(this.userData));
          JSON.parse(localStorage.getItem('user'));
          this.isLogging$.next(true);
        } else {
          localStorage.setItem('user', null);
          JSON.parse(localStorage.getItem('user'));
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
  async SignIn(email, password): Promise<boolean> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      await this.SetUserData(userCredential);
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve(false);
  }

  // Sign up with email/password
  async SignUp(email, password): Promise<UserCredential | void> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      /* Call the SendVerificationMail(userCredential) function when new user sign
      up and returns promise */
      await this.SendVerificationMail(userCredential);
      await this.SetUserData(userCredential);
      return Promise.resolve(userCredential);
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve();
  }

  // Send email verification when new user sign up
  async SendVerificationMail(userCredential: UserCredential): Promise<void> {
    try {
      await userCredential.user.sendEmailVerification();
      await this.router.navigate(['/']);
    } catch (e) {
      console.error(e);
    }
    return Promise.resolve();
  }

  // Reset Forgot password
  async ForgotPassword(passwordResetEmail): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(passwordResetEmail);
      window.alert('Password reset email sent, check your inbox.');
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve();
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
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
        this.router.navigate(['/']);
      });
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve();
  }

  // Auth logic to run auth providers
  private async AuthLogin(provider): Promise<void> {
    try {
      const userCredential = await this.afAuth.signInWithPopup(provider);
      console.log(' AuthLogin');
      await this.SetUserData(userCredential);
      this.ngZone.run(() => {
        this.router.navigate(['/']);
      });
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve();
  }

  /**
   * Si es la versión web esperamos una promesa por si se recibe los datos de un inicio de sesión
   */
  public async AuthCheckLoginRedirect(): Promise<boolean> {
    if (!this.electronService.isElectronApp) {
      const userCredential = await firebase.auth().getRedirectResult();
      if (userCredential.user !== null) {
        console.log('Entra en getRedirectResult', userCredential);
        await this.SetUserData(userCredential);
        this.ngZone.run(() => {
          this.router.navigate(['/']);
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
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${userCredential.user.uid}`);
    const userData: InterfaceUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified
    };
    return userRef.set(userData, {
      merge: true
    });
  }

  // Sign out
  async SignOut() {
    try {
      await this.afAuth.signOut();
      localStorage.removeItem('user');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
    }
  }

}
