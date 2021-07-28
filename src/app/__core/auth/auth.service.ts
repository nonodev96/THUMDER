import {Injectable, NgZone} from '@angular/core';
import {User} from "../interfaces";
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Router} from "@angular/router";
import {AppConfig} from "../../../environments/environment";
import firebase from "firebase/app";
import 'firebase/auth'
import GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
import GithubAuthProvider = firebase.auth.GithubAuthProvider;

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  isServer: boolean = AppConfig.server;
  userData: User; // Save logged in user data

  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    })
  }

  // Sign in with email/password
  SignIn(email, password) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        await this.SetUserData(userCredential);
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        });
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Sign up with email/password
  SignUp(email, password) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        /* Call the SendVerificationMail(userCredential) function when new user sign
        up and returns promise */
        await this.SendVerificationMail(userCredential);
        await this.SetUserData(userCredential);
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Send email verification when new user sign up
  SendVerificationMail(userCredential) {
    return userCredential.user.sendEmailVerification()
      .then(async () => {
        await this.router.navigate(['/verify-email-address']);
      })
  }

  // Reset Forgot password
  ForgotPassword(passwordResetEmail) {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.');
      }).catch((error) => {
        window.alert(error)
      })
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null /*&& user.emailVerified !== false*/);
  }

  // Sign in with Google
  GoogleAuth(): Promise<void> {
    return this.AuthLogin(new GoogleAuthProvider());
  }

  // Sign in with Google
  GithubAuth(): Promise<void> {
    return this.AuthLogin(new GithubAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLoginAnonymously(): Promise<void> {
    return this.afAuth.signInAnonymously()
      .then(async (userCredential) => {

        await this.SetUserData(userCredential);
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        })

      }).catch((error) => {
        window.alert(error)
      })
  }

  // Auth logic to run auth providers
  private AuthLogin(provider): Promise<void> {
    return this.afAuth.signInWithRedirect(provider)
      .then(() => {
        console.log('Entra en signInWithRedirect')
      }).catch((error) => {
        window.alert(error)
      })
  }

  public AuthCheckLoginRedirect(): Promise<boolean> {
    return new Promise(((resolve) => {

      this.afAuth.getRedirectResult()
        .then(async (userCredential) => {
          if (userCredential.user !== null) {
            console.log('Entra en getRedirectResult', userCredential)
            await this.SetUserData(userCredential);
          }
          resolve(true)
        })

    }));
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(userCredential) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${userCredential.user.uid}`);
    const userData: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign out
  SignOut() {
    return this.afAuth.signOut().then(
      async () => {
        localStorage.removeItem('user');
        await this.router.navigate(['/login']);
      }
    )
  }

}
