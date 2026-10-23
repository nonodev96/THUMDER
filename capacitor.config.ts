import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// The applications of Android and iOS (Capacitor): the same Angular application as the web, built by
// `pnpm run mobile:build` into dist-mobile/browser, inside a native shell. The native projects are in src-mobile/.
const config: CapacitorConfig = {
  appId: "com.nonodev96.thumder",
  appName: "THUMDER",
  webDir: "dist-mobile/browser",
  android: {
    path: "src-mobile/android",
  },
  ios: {
    path: "src-mobile/ios",
  },
  plugins: {
    // Edge to edge (index.html has viewport-fit=cover): the page leaves room for the bars. Besides env(safe-area-inset-*),
    // Capacitor gives the page their sizes in --safe-area-inset-* (again after each page load): the WebView sometimes
    // misses them when the application starts, and then env() stays at 0 (src/styles.scss uses both)
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
    },
    // The WebView gets smaller when the keyboard of the system opens (also edge to edge on Android), so the editor and
    // the fields stay over it; the bar of the simulation hides meanwhile (FooterComponent)
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
    // The page hides it when it has drawn itself (MobileService), with the colour of the dark theme meanwhile
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0f172a",
      showSpinner: false,
    },
    // Native sign-in with Google, GitHub and Apple; the session is the one of the Firebase JavaScript SDK (AuthService
    // signs in with the credential), so Firestore and the rest work as in the web
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com", "github.com", "apple.com"],
    },
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: "6.1",
        // GoogleSignIn without the Facebook SDK, and without the collision of package names of SwiftPM
        packageTraits: { "@capacitor-firebase/authentication": ["Google"] },
        packageOptions: { "@capacitor-firebase/authentication": { symlink: true } },
      },
    },
  },
};

export default config;
