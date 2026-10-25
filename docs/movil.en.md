# The Android and iOS applications

THUMDER on Android and iOS is the same Angular application as the web, inside [Capacitor](https://capacitorjs.com): the
simulator, the views, the exercises, the translations and the tests are the same. Only what has to be native on a phone
changes.

## What there is and where

| Part | What it does |
| :-- | :-- |
| `capacitor.config.ts` | The identifier (`com.nonodev96.thumder`), the web that is copied (`dist-mobile/browser`) and the configuration of the plugins |
| `src-mobile/android/` | The Android project (Gradle). The version comes from `package.json` (`app/build.gradle`) |
| `src-mobile/ios/` | The iOS project (Xcode, with Swift Package Manager). `pnpm version` sets its version (`scripts/mobile-version.mjs`) |
| `src/app/__core/services/mobile/` | `MobileService` and what is decided without the native part (`mobile.ts`, with its tests) |
| The `mobile` configuration of `angular.json` | The production one (base `/`, the Firebase keys of the web), built in `dist-mobile` |

What changes in the applications (`html.thumder-mobile`, and `thumder-android` or `thumder-ios`):

- **Edge to edge**: the page fills the whole screen (`viewport-fit=cover`) and what is fixed at the top and the bottom leaves
  room for the system bars (`--thumder-safe-top` and `--thumder-safe-bottom` in `src/styles.scss`). On Android, Capacitor gives
  the page their sizes (`--safe-area-inset-*`, `insetsHandling: "css"`), because sometimes the WebView does not get them at
  start and `env(safe-area-inset-*)` stays at 0. The icons of the bars follow the theme.
- **The Android back button** closes what is on top (a modal, a dropdown, the maximised card, the side menu), then goes back a
  page and, on the home page, sends THUMDER to the background.
- **Links to other sites** open in the browser of the system, in a tab over THUMDER.
- **Saving a file** (exporting programs, the ZIP, the CSV files, the images of the diagram) opens the share menu of the
  system: a WebView does not download (`__shared/utils/download.ts`, `mobile/native-files.ts`). Importing opens the file
  picker.
- **Signing in with Google, GitHub and Apple is the system one** (`@capacitor-firebase/authentication`), and the session is
  the one of the Firebase web SDK (`signInWithCredential`), so Firestore works the same. Without the native configuration of
  Firebase (see below), the plugin does not load and the application offers email and password and guest, as the desktop.
- **The links of shared exercises** (`https://thumder.netlify.app/auth/shared...`) open the exercise in the application.
- **The splash screen** goes away when the page has been drawn.

In every version, the web too, the **account can be deleted** from the profile (Apple and Google Play require it; the page
`/landing/delete-account` explains how and what is deleted), the files ask for **persistent storage** when the first one is
saved, and the error reports say the platform (`android` or `ios`; `firestore.rules` accepts them).

## Build and test

Requirements: Node 22, a JDK 21 with a compiler (the one of Android Studio works: `JAVA_HOME=/usr/local/android-studio/jbr`)
and the Android 36 SDK; for iOS, a Mac with Xcode 16.3 or later.

| Command | What it does |
| :-- | :-- |
| `pnpm run mobile:build` | Builds the web for the applications and copies it into both projects (`cap sync`) |
| `pnpm run mobile:android` | The same and opens it in the emulator or on the connected phone (`cap run android`) |
| `pnpm run mobile:ios` | The same and opens the project in Xcode |
| `./gradlew assembleDebug` (in `src-mobile/android`) | The debug APK, in `app/build/outputs/apk/debug/` |

To debug the page: `chrome://inspect` in Chrome with the phone or the Android emulator, and the Safari web inspector with
iOS. The CI builds both applications on each push (`ci.yaml`: the debug APK and the build for the iOS simulator, unsigned)
and runs the phone and tablet tests also with WebKit, the engine of iOS (projects `iphone` and `ipad` of
`playwright.config.ts`). On Linux, WebKit needs the library `libavif16`; without it, the same tests run with the Playwright
image:

```bash
docker run --rm --network host --ipc=host -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test --project iphone --project ipad
```

### What to check on a phone before publishing

It starts without flashes and the splash screen goes away; the system bars in both themes; the back button (modal, menu,
maximised card, pages, exit); loading and running a program; typing in the editor with the system keyboard (the simulation
bar hides); exporting and importing files; an external link; signing in and deleting the account; offline (airplane mode);
rotating the screen; a link of a shared exercise.

## Native sign-in (Firebase)

The configuration files of Firebase are not in git (like `src/environments`):

1. **Android**: in the Firebase console, add an Android app with the package `com.nonodev96.thumder` and the SHA-1 and SHA-256
   fingerprints of the keys that sign it (the debug one, `keytool -list -v -keystore ~/.android/debug.keystore`, and those of
   Google Play: the upload one and the *Play App Signing* one). Download `google-services.json` to `src-mobile/android/app/`.
2. **iOS**: add an iOS app with the identifier `com.nonodev96.thumder`, download `GoogleService-Info.plist` to
   `src-mobile/ios/App/App/` and add it to the target in Xcode. For Google, add the `REVERSED_CLIENT_ID` of that file in
   *URL Types*.
3. **GitHub** is already enabled for the web; the guide of the plugin says if anything else is needed on each system
   ([setup-github](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-github.md)).
4. **Apple**: enable *Sign in with Apple* in the identifier of the app (Apple Developer), create its *Services ID* and its
   key, enable the Apple provider in Firebase and add the *Sign in with Apple* capability in Xcode. Then set
   `signInWithApple: true` in `src/environments/environment.production.ts` (and in the secret `ANGULAR_ENVIROTMENT_PRODUCTION`).
   Until then, the iOS application does not offer Google or GitHub: guideline 4.8 of the App Store requires them next to a
   sign-in like Apple's (`src/app/__core/auth/sign-in.ts`).

## Sign and publish

### Android

1. Create the upload key (keep it safe: without it no updates can be published):
   `keytool -genkeypair -v -keystore thumder-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias thumder`.
2. Add the secrets of the repository: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 thumder-upload.jks; echo`: copy only the text,
   without the `%` zsh adds at the end if the `echo` is missing), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
   (`ANDROID_KEY_PASSWORD` only if the key has another password: with PKCS12, the format of `keytool`, it is the same) and,
   for native sign-in, `GOOGLE_SERVICES_JSON` (the file in base64).
3. With each `v*` tag, `create-release.yaml` adds to the draft of the release `THUMDER-v<version>-android.aab` (for Google
   Play) and `THUMDER-v<version>-android.apk` (to install by hand), signed and with their provenance and SBOM attestations
   (`gh attestation verify THUMDER-v<version>-android.apk --repo nonodev96/THUMDER`). When the draft is published, the APK
   can be downloaded from the GitHub releases: Android asks to allow installing applications from that source, and to update,
   the new APK is downloaded (there are no automatic updates).

   If you also publish on Google Play, decide the *Play App Signing* key before the first upload: if you choose to use your
   own key (the same that signs the GitHub APK), a GitHub install updates from Google Play and the other way round; if you let
   Google generate its own, they are different signatures and to switch from one to the other you have to uninstall.
4. In Google Play Console: upload the AAB to the internal testing track, with *Play App Signing*. Fill in the data safety
   (consistent with `src/assets/legal/privacy.*.md`), the content rating, the store listing in Spanish and English and the
   account deletion URL: `https://thumder.netlify.app/landing/delete-account` (the steps, what is deleted and what is not,
   and how to ask for it without being able to get in). A new personal account has to go through a closed test first (check
   the current conditions: today, 12 testers for 14 days).

### iOS

With the Apple Developer account: in Xcode choose the team, *Product → Archive* and upload it to App Store Connect to test it
in TestFlight. The guidelines that matter most: 4.2 (minimum functionality: THUMDER simulates offline, saves and shares
files), 4.8 (Sign in with Apple) and 5.1.1(v) (account deletion, already done). The encryption declaration is already in
`Info.plist` (HTTPS only). Signing and uploading from GitHub Actions (fastlane `match` or an App Store Connect API key) waits
until there is an account.

## The links of shared exercises

For a link `https://thumder.netlify.app/auth/shared...` to open the application without asking, the web has to say which
applications are its own. It needs the fingerprints of the final keys, so they are not there yet:

- **Android** (the intent filter is already in `AndroidManifest.xml`): `src/.well-known/assetlinks.json` with the SHA-256
  fingerprint of the *Play App Signing* key, and add it to the `assets` of `angular.json`:

  ```json
  [{ "relation": ["delegate_permission/common.handle_all_urls"],
     "target": { "namespace": "android_app", "package_name": "com.nonodev96.thumder",
                 "sha256_cert_fingerprints": ["<SHA-256 fingerprint>"] } }]
  ```

- **iOS**: the *Associated Domains* capability with `applinks:thumder.netlify.app` in Xcode, and
  `src/.well-known/apple-app-site-association` (no extension, served as JSON) with
  `{ "applinks": { "details": [{ "appIDs": ["<TEAM_ID>.com.nonodev96.thumder"], "components": [{ "/": "/auth/shared*" }] }] } }`.

## Pending

- Test iOS on a simulator or an iPhone (there is no Mac here): above all the editor (Monaco) with the keyboard in WKWebView.
  On Android it works.
- Test the native sign-in end to end, with the Firebase configuration.
- The texts that say "browser" (the privacy, the cookie notice): in the applications it is the device. The file manager and
  the profile already say it right.
- The safe areas at the sides (the notch with the phone rotated) and the icons of the status bar over the open side menu with
  the light theme.
