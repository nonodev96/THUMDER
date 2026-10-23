# Las aplicaciones de Android e iOS

THUMDER en Android e iOS es la misma aplicación Angular que la web, dentro de [Capacitor](https://capacitorjs.com): el
simulador, las vistas, los ejercicios, las traducciones y las pruebas son los mismos. Solo cambia lo que en un móvil tiene que
ser nativo.

## Qué hay y dónde

| Parte | Qué hace |
| :-- | :-- |
| `capacitor.config.ts` | El identificador (`com.nonodev96.thumder`), la web que se copia (`dist-mobile/browser`) y la configuración de los plugins |
| `src-mobile/android/` | El proyecto de Android (Gradle). La versión sale de `package.json` (`app/build.gradle`) |
| `src-mobile/ios/` | El proyecto de iOS (Xcode, con Swift Package Manager). `pnpm version` le pone la versión (`scripts/mobile-version.mjs`) |
| `src/app/__core/services/mobile/` | `MobileService` y lo que se decide sin la parte nativa (`mobile.ts`, con sus pruebas) |
| La configuración `mobile` de `angular.json` | La de producción (base `/`, las claves de Firebase de la web), compilada en `dist-mobile` |

Lo que cambia en las aplicaciones (`html.thumder-mobile`, y `thumder-android` o `thumder-ios`):

- **De borde a borde**: la página ocupa toda la pantalla (`viewport-fit=cover`) y lo fijo arriba y abajo deja sitio a las barras
  del sistema (`--thumder-safe-top` y `--thumder-safe-bottom` en `src/styles.scss`). En Android, Capacitor le da sus medidas a la
  página (`--safe-area-inset-*`, `insetsHandling: "css"`), porque a veces el WebView no las recibe al arrancar y
  `env(safe-area-inset-*)` se queda en 0. Los iconos de las barras siguen el tema.
- **El botón atrás de Android** cierra lo que está encima (un modal, un desplegable, la tarjeta maximizada, el menú lateral),
  luego vuelve de página y, en el inicio, deja THUMDER en segundo plano.
- **Los enlaces a otros sitios** se abren en el navegador del sistema, en una pestaña sobre THUMDER.
- **Guardar un fichero** (exportar programas, el ZIP, los CSV, las imágenes del diagrama) abre el menú de compartir del sistema:
  un WebView no descarga (`__shared/utils/download.ts`, `mobile/native-files.ts`). Importar abre el selector de ficheros.
- **El inicio de sesión con Google, GitHub y Apple es el del sistema** (`@capacitor-firebase/authentication`), y la sesión es la
  del SDK web de Firebase (`signInWithCredential`), así que Firestore funciona igual. Sin la configuración nativa de Firebase
  (ver abajo), el plugin no carga y la aplicación ofrece correo y contraseña e invitado, como el escritorio.
- **Los enlaces de ejercicios compartidos** (`https://thumder.netlify.app/auth/shared...`) abren el ejercicio en la aplicación.
- **La pantalla de inicio** se va cuando la página se ha dibujado.

En todas las versiones, también en la web, se puede **borrar la cuenta** desde el perfil (lo exigen Apple y Google Play; la
página `/landing/delete-account` explica cómo y qué se borra), los
ficheros piden **almacenamiento persistente** al guardar el primero, y los informes de errores dicen la plataforma (`android` o
`ios`; `firestore.rules` los acepta).

## Compilar y probar

Requisitos: Node 22, un JDK 21 con compilador (el de Android Studio sirve: `JAVA_HOME=/usr/local/android-studio/jbr`) y el SDK
de Android 36; para iOS, un Mac con Xcode 16.3 o posterior.

| Comando | Qué hace |
| :-- | :-- |
| `pnpm run mobile:build` | Compila la web para las aplicaciones y la copia en los dos proyectos (`cap sync`) |
| `pnpm run mobile:android` | Lo mismo y la abre en el emulador o en el móvil conectado (`cap run android`) |
| `pnpm run mobile:ios` | Lo mismo y abre el proyecto en Xcode |
| `./gradlew assembleDebug` (en `src-mobile/android`) | El APK de depuración, en `app/build/outputs/apk/debug/` |

Para depurar la página: `chrome://inspect` en Chrome con el móvil o el emulador de Android, y el inspector web de Safari con
iOS. La CI compila las dos aplicaciones en cada push (`ci.yaml`: el APK de depuración y la compilación para el simulador de
iOS, sin firmar) y pasa las pruebas de móvil y tableta también con WebKit, el motor de iOS (proyectos `iphone` e `ipad` de
`playwright.config.ts`). En Linux, WebKit necesita la librería `libavif16`; sin ella, las mismas pruebas se pasan con la imagen
de Playwright:

```bash
docker run --rm --network host --ipc=host -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test --project iphone --project ipad
```

### Lo que hay que comprobar en un móvil antes de publicar

Arranca sin destellos y se va la pantalla de inicio; las barras del sistema en los dos temas; el botón atrás (modal, menú,
tarjeta maximizada, páginas, salir); cargar y ejecutar un programa; escribir en el editor con el teclado del sistema (la barra
de la simulación se esconde); exportar e importar ficheros; un enlace externo; iniciar sesión y borrar la cuenta; sin conexión
(modo avión); girar la pantalla; un enlace de un ejercicio compartido.

## El inicio de sesión nativo (Firebase)

Los ficheros de configuración de Firebase no están en git (como `src/environments`):

1. **Android**: en la consola de Firebase, añade una app de Android con el paquete `com.nonodev96.thumder` y las huellas SHA-1 y
   SHA-256 de las claves que la firman (la de depuración, `keytool -list -v -keystore ~/.android/debug.keystore`, y las de
   Google Play: la de subida y la de *Play App Signing*). Descarga `google-services.json` en `src-mobile/android/app/`.
2. **iOS**: añade una app de iOS con el identificador `com.nonodev96.thumder`, descarga `GoogleService-Info.plist` en
   `src-mobile/ios/App/App/` y añádelo al target en Xcode. Para Google, añade en *URL Types* el `REVERSED_CLIENT_ID` de ese
   fichero.
3. **GitHub** ya está activado para la web; la guía del plugin dice si hace falta algo más en cada sistema
   ([setup-github](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-github.md)).
4. **Apple**: activa *Sign in with Apple* en el identificador de la app (Apple Developer), crea su *Services ID* y su clave,
   activa el proveedor Apple en Firebase y añade la capacidad *Sign in with Apple* en Xcode. Después pon
   `signInWithApple: true` en `src/environments/environment.production.ts` (y en el secreto `ANGULAR_ENVIROTMENT_PRODUCTION`).
   Mientras no lo esté, la aplicación de iOS no ofrece Google ni GitHub: la directriz 4.8 de la App Store los pide junto a un
   inicio de sesión como el de Apple (`src/app/__core/auth/sign-in.ts`).

## Firmar y publicar

### Android

1. Crea la clave de subida (guárdala bien: sin ella no se pueden publicar actualizaciones):
   `keytool -genkeypair -v -keystore thumder-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias thumder`.
2. Añade los secretos del repositorio: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 thumder-upload.jks`), `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS` (`ANDROID_KEY_PASSWORD` solo si la clave tiene otra contraseña: con PKCS12, el formato de `keytool`, es
   la misma) y, para el inicio de sesión nativo, `GOOGLE_SERVICES_JSON` (el fichero en base64).
3. Con cada etiqueta `v*`, `create-release.yaml` añade al borrador de la versión `THUMDER-v<versión>-android.aab` (para Google
   Play) y `THUMDER-v<versión>-android.apk` (para instalar a mano), firmados y con sus atestaciones de procedencia y SBOM
   (`gh attestation verify THUMDER-v<versión>-android.apk --repo nonodev96/THUMDER`). Al publicar el borrador, el APK queda
   para descargar desde las releases de GitHub: Android pide permitir instalar aplicaciones de ese origen, y para actualizar
   se descarga el APK nuevo (no hay actualizaciones automáticas).

   Si también publicas en Google Play, decide la clave de *Play App Signing* antes de la primera subida: si eliges usar tu
   propia clave (la misma que firma el APK de GitHub), una instalación de GitHub se actualiza desde Google Play y al revés; si
   dejas que Google genere la suya, son firmas distintas y para cambiar de una a otra hay que desinstalar.
4. En Google Play Console: sube el AAB a la pista de pruebas internas, con *Play App Signing*. Rellena la seguridad de los datos
   (coherente con `src/assets/legal/privacy.*.md`), la clasificación por edades, la ficha en español e inglés y la URL de borrado
   de la cuenta: `https://thumder.netlify.app/landing/delete-account` (los pasos, qué se borra y qué no, y cómo pedirlo sin
   poder entrar). Una cuenta personal nueva tiene que
   pasar antes por una prueba cerrada (comprobar las condiciones vigentes: hoy, 12 probadores durante 14 días).

### iOS

Con la cuenta de Apple Developer: en Xcode elige el equipo, *Product → Archive* y súbelo a App Store Connect para probarlo en
TestFlight. Directrices que más afectan: 4.2 (funcionalidad mínima: THUMDER simula sin conexión, guarda y comparte ficheros),
4.8 (Sign in with Apple) y 5.1.1(v) (borrar la cuenta, ya hecho). La declaración de cifrado ya está en `Info.plist` (solo
HTTPS). Firmar y subir desde GitHub Actions (fastlane `match` o una clave de la API de App Store Connect) queda para cuando
haya cuenta.

## Los enlaces de los ejercicios compartidos

Para que un enlace `https://thumder.netlify.app/auth/shared...` abra la aplicación sin preguntar, la web tiene que decir qué
aplicaciones son suyas. Hacen falta las huellas de las claves definitivas, así que todavía no están:

- **Android** (el filtro de intents ya está en `AndroidManifest.xml`): `src/.well-known/assetlinks.json` con la huella SHA-256
  de la clave de *Play App Signing*, y añadirlo a los `assets` de `angular.json`:

  ```json
  [{ "relation": ["delegate_permission/common.handle_all_urls"],
     "target": { "namespace": "android_app", "package_name": "com.nonodev96.thumder",
                 "sha256_cert_fingerprints": ["<huella SHA-256>"] } }]
  ```

- **iOS**: la capacidad *Associated Domains* con `applinks:thumder.netlify.app` en Xcode, y
  `src/.well-known/apple-app-site-association` (sin extensión, servido como JSON) con
  `{ "applinks": { "details": [{ "appIDs": ["<TEAM_ID>.com.nonodev96.thumder"], "components": [{ "/": "/auth/shared*" }] }] } }`.

## Pendiente

- Probar iOS en un simulador o en un iPhone (aquí no hay Mac): sobre todo el editor (Monaco) con el teclado en WKWebView. En
  Android funciona.
- Probar el inicio de sesión nativo de punta a punta, con la configuración de Firebase.
- Los textos que dicen «navegador» (la privacidad, el aviso de cookies): en las aplicaciones es el dispositivo. El gestor de
  ficheros y el perfil ya lo dicen bien.
- Las zonas seguras a los lados (la muesca con el móvil girado) y los iconos de la barra de estado sobre el menú lateral abierto
  con el tema claro.
