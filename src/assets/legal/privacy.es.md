# Privacidad y cookies

_Última actualización: 23 de octubre de 2026_

THUMDER es un simulador educativo del procesador DLX, gratuito y de código abierto (licencia MIT). Esta página explica qué datos usa, para qué, y cómo decides tú. Tu elección se cambia en cualquier momento desde **Ajustes de privacidad**, en el pie de página.

## Responsable

Antonio Mudarra Machuca, autor de THUMDER. Para cualquier consulta sobre tus datos, abre una incidencia en [GitHub](https://github.com/nonodev96/THUMDER/issues).

## Sin cuenta, todo se queda en tu navegador

Si usas THUMDER sin iniciar sesión, tus programas y tu configuración se guardan solo en tu navegador. No se envían a ningún servidor. Los borras desde el gestor de ficheros o borrando los datos de este sitio en tu navegador.

## Lo que se guarda en tu navegador (necesario)

No son cookies: no viajan a ningún servidor. Son imprescindibles para que el simulador funcione como pides, por eso no necesitan tu consentimiento (artículo 22.2 de la LSSI).

| Nombre | Para qué |
| :-- | :-- |
| `local_file_items` y la base de datos `thumder` (IndexedDB) | Tus ficheros, cuando no has iniciado sesión |
| `interfaceFileItem`, `program_modules` | El fichero abierto en el editor y los módulos que se cargan con él |
| `thumder_configuration` | La configuración del simulador y de la vista múltiple |
| `breakpoints`, `breakpoint_stages`, `watchpoints` | Los puntos de ruptura |
| `exercise_progress`, `exercise_locks` | Tu progreso en los ejercicios |
| `lang`, `theme`, `registers_tab`, `statistics_tab` | El idioma, el tema y la pestaña abierta de algunas vistas |
| `log_level` | El detalle de la consola de depuración |
| `thumder_consent` | Tu elección sobre privacidad |

## Con cuenta (opcional)

Si inicias sesión (con correo y contraseña, Google, GitHub o Apple), Firebase Authentication, de Google, trata tu correo, tu nombre y tu foto de perfil para identificarte, y guarda la sesión en tu navegador. Tus ficheros se guardan en Cloud Firestore, asociados a tu cuenta, para que los tengas en cualquier equipo.

- **Base jurídica:** prestarte el servicio que pides (artículo 6.1.b del RGPD).
- **Conservación:** mientras tengas la cuenta. Puedes borrar tus ficheros cuando quieras y borrar la cuenta (ver abajo).

## Borrar tu cuenta

Desde THUMDER, en la web o en las aplicaciones de escritorio, Android e iOS: inicia sesión, abre tu **Perfil** y pulsa **Borrar la cuenta**. Se borran tu cuenta, tu perfil y todos tus ficheros, en la nube y en ese dispositivo, y no se puede deshacer. Por seguridad, hay que haber iniciado sesión hace pocos minutos. Si no puedes entrar en THUMDER, pide el borrado con el contacto de arriba, desde el correo de tu cuenta, y se hará en un plazo máximo de un mes. Los pasos, y qué se borra y qué no, están en la pestaña **Borrar la cuenta**, arriba.

## Analíticas (solo si las aceptas)

Si lo permites, Google Analytics para Firebase cuenta de forma agregada las visitas, las páginas que se usan, el tipo de dispositivo y el país aproximado, para saber qué mejorar.

- **Cookies:** `_ga` y `_ga_<id>`, que duran hasta 2 años.
- **Base jurídica:** tu consentimiento (artículo 6.1.a del RGPD).
- **Quién las trata:** Google LLC, como encargado del tratamiento. Los datos pueden tratarse en Estados Unidos, al amparo del Marco de Privacidad de Datos UE-EE. UU.
- **Retirada:** desde **Ajustes de privacidad**, en el pie de página. THUMDER deja de enviar datos y borra esas cookies.

## Informes de errores (puedes desactivarlos)

Cuando una versión publicada de THUMDER (la web o las aplicaciones de escritorio, Android e iOS) falla de forma inesperada, envía a Cloud Firestore un informe técnico:

- el mensaje y la traza del error;
- la vista en la que estabas, sin parámetros;
- la versión de THUMDER, y si es la web o la aplicación de escritorio, de Android o de iOS;
- el navegador (su _user agent_) y el idioma.

No incluye tu cuenta, tus ficheros ni las carpetas de tu equipo, y no usa cookies. Sirve para encontrar y corregir errores.

- **Base jurídica:** el interés legítimo en que el simulador funcione bien (artículo 6.1.f del RGPD). Puedes oponerte desactivándolos en **Ajustes de privacidad**.
- **Conservación:** hasta que el error está corregido.

## Alojamiento y servicios externos

- La web se sirve desde Netlify, que registra datos técnicos de cada petición (como la dirección IP) para entregar la página y protegerla.
- Las animaciones de la documentación se cargan desde GitHub (`raw.githubusercontent.com`).
- Si inicias sesión con Google, GitHub o Apple, se abre su ventana de inicio de sesión (en Android e iOS, la del sistema), con su propia política de privacidad.
- La aplicación de escritorio no usa cookies ni analíticas.
- Las aplicaciones de Android e iOS usan los mismos servicios que la web y guardan tus datos en el propio dispositivo. Google Play y la App Store, desde donde se instalan, tratan los datos de la descarga según sus políticas.

## Tus derechos

Puedes pedir el acceso, la rectificación, la supresión, la limitación y la portabilidad de tus datos, y oponerte a su tratamiento, con el contacto de arriba. Si crees que no se ha atendido bien tu petición, puedes reclamar ante la [Agencia Española de Protección de Datos](https://www.aepd.es).

## Cambios

Si cambia lo que THUMDER usa, se actualizará esta página y se te volverá a preguntar.
