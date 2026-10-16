# Cierre de TODO-mejoras

Plan por fases para las 62 tareas abiertas de [TODO-mejoras.md](TODO-mejoras.md) (16 de octubre de 2026). Cada fase deja la aplicación funcionando y se comprueba con las pruebas unitarias, las e2e y la auditoría de la interfaz adaptable antes de pasar a la siguiente. Al cerrar una tarea, se marca también en `TODO-mejoras.md`.

## Decisiones (16 de octubre de 2026)

- [x] **Sin commits**: los cambios se quedan sin commit, como hasta ahora.
- [x] **Fuera el modo THUMDER-server del cliente**: solo el simulador local. THUMDER-server queda como repositorio aparte, así que SRV-01 a SRV-07 dejan de aplicar al cliente.
- [x] **Firebase opcional, para sincronizar**: invitado por defecto, con los ficheros en IndexedDB, e importar y exportar. Con claves de Firebase, iniciar sesión sincroniza.
- [x] **Un solo sistema de interfaz (UI-01)**: el CSS de AdminLTE 3 y Bootstrap 4, que ya no necesita jQuery, más el CDK de Angular para el comportamiento. Se quitan Angular Material como sistema visual, Covalent y Material Icons. Esto cambia la recomendación anterior (Angular Material): con jQuery fuera, es mucho menos trabajo y no cambia el aspecto.

## Fase A. Red de seguridad

**Objetivo**: pruebas e2e en el repositorio que comprueben cada cambio de las fases siguientes.

- [x] **TEST-03.** Playwright en el repositorio (`e2e/`), en lugar de Cypress:
  - interacciones (menú, tarjetas, desplegables, modales, acordeones, zoom);
  - simulación (cargar, pasos, ejecutar, consola);
  - interfaz adaptable en 5 tamaños;
  - Electron.
- [x] Las e2e en CI (`ci.yaml`), con el navegador instalado en el flujo.
- [x] **TEST-02.** Pruebas del núcleo que faltan (servicios de la máquina, configuración y ficheros).
- [x] **A11Y-05.** axe en las e2e de cada vista.

**Resultado** (16 de octubre de 2026):

- Fuera Spectron (`e2e/`), Cypress 9 y `cypress.json`; dentro `@playwright/test` 1.64 y `@axe-core/playwright`.
- `pnpm e2e` pasa 47 pruebas en 48 s: escritorio, móvil (Pixel 7) y tableta. Comprueban:
  - el menú lateral, los desplegables, las cookies, las tarjetas, las modales, los acordeones y el zoom;
  - la simulación con consola, los ejemplos, los errores de ensamblado, los puntos de ruptura y la coma flotante;
  - la interfaz adaptable en 5 tamaños y 16 rutas;
  - axe en 15 vistas.
- `pnpm e2e:electron` compila con `build:prod` y prueba la aplicación de escritorio. Pasa.
- Las dos, en CI (`ci.yaml`), y el informe se guarda si fallan.
- **axe:** quedan 6 reglas pendientes, cada una con su causa, en `PENDING` de `e2e/a11y.spec.ts`. Se quitan en la fase G.
- **BUG-28, corregido:** un punto de ruptura quitado en el editor seguía parando la ejecución. El editor lo guarda con `false` y `getAllLinesWithBreakpoints` devolvía todas las líneas. Lo cubren una prueba unitaria y una e2e.
- **TEST-02:** pruebas de `ManagerBreakpoints` y de `stringFormat`, y fuera `Utils.stringFormat`, que repetía el de `MachineService` sin que nadie lo usara. 264 pruebas unitarias en verde.

## Fase B. Solo el simulador local

**Objetivo**: un cliente sin THUMDER-server.

- [x] Fuera `SocketProviderConnectService`, socket.io, la opción «Simulador» y la URL del servidor de la configuración, y `thumder-ontology` del cliente.
- [x] `MachineService` habla solo con el Worker.
- [x] **SRV-01 a SRV-07**: eran del repositorio de THUMDER-server; quitadas de TODO-mejoras.md.
- [x] **DOC-03.** Documentar el protocolo del Worker (`runner.ts`) en lugar del del socket.
- [x] **UI-11.** Configuración comprensible: explicar cada opción y confirmar antes de reiniciar la máquina.

**Resultado** (16 de octubre de 2026):

- **Fuera del cliente:**
  - `SocketProviderConnectService` y la vista de depuración del socket («Pruebas», `/auth/debug`);
  - las opciones «Simulador» y «URL del servidor», y la insignia y el botón de reconectar de la barra superior;
  - `ngx-socket-io`, `thumder-ontology` y el script `ws:server`;
  - los campos `socket_url`, `readonly_web_socket_url` y `server` del entorno.
- **`MachineService`** usa solo el Worker y ya no tiene el bucle de pasos del servidor.
- **Configuración por secciones** (pipeline, memoria, simulación, editor y vista múltiple), con una explicación en cada opción y los valores ajustados a sus límites. Si hay una simulación en marcha, pide confirmación antes de reiniciarla.
- **DOC-03:** el protocolo del Worker, en `docs/simulador.md`.
- **BUG-29, corregido:** con una memoria más pequeña que el programa, la página lanzaba un `RangeError`. La configuración llegaba al simulador después de ensamblar; ahora llega antes, y un programa que no cabe es un error de ensamblado.
- **Sin borrar valores por defecto:** «Valores por defecto» asignaba los objetos por defecto sin copiarlos, y el formulario los cambiaba. Además, cada escritura volvía a leer el formulario y pisaba los valores que aún no se habían guardado.
- 261 pruebas unitarias (la de `MachineService`, reescrita con un simulador falso) y 50 e2e (3 nuevas de la configuración) en verde.

## Fase C. Estructura y compilación

**Objetivo**: la base sobre la que se cambia el núcleo y la interfaz.

- [x] **BLD-07.** Componentes, *pipes* y directivas `standalone`; fuera `SharedModule`, `ComponentsModule` y `CoreModule`.
- [x] **BLD-03.** Dependencias desfasadas o incoherentes; `pnpm audit`.
- [x] **BLD-04.** Fuera la configuración obsoleta.
- [x] **BLD-06.** `.browserslistrc` alineado con Angular 20.
- [x] **NUC-05.** Fuera el código muerto del núcleo.
- [x] **NUC-07.** `LoggerService` con niveles; fuera los `console.*` sueltos.
- [x] **BUG-18.** Suscripciones con `takeUntilDestroyed`.

**Resultado** (16 de octubre de 2026):

- **BLD-07:**
  - todo es `standalone` (*schematic* oficial en sus tres modos);
  - fuera los 11 NgModule (`AppModule`, `SharedModule`, `ComponentsModule`, `CoreModule`, los de `auth`, `account` y `landing`, y sus módulos de rutas);
  - la aplicación arranca con `bootstrapApplication`, `app.config.ts` y `app.routes.ts`;
  - las rutas perezosas cargan `auth.routes.ts`, `account.routes.ts` y `landing.routes.ts`.
- **BLD-03:**
  - actualizados ngx-translate (14 a 17, con `provideTranslateService`), ngx-markdown (19 a 20, con marked 16, que es la versión que admite), `@types/node` (14 a 22) y firebase-tools (11 a 15);
  - fuera ng2-charts, chart.js y `@types/chart.js` (no se dibujaba ningún gráfico), ngx-cookie-service (no se usaba), el ESLint entero (lint solo con Biome), `@angular-devkit/build-angular` y varios restos (chai, `@types/mocha`, electron-chromedriver, ts-node, cross-env, core-js, `@popperjs/core`, dos complementos de xterm…);
  - `@angular/fire` y `firebase` se actualizan en la fase E, con los datos, y electron-builder en la fase H.
- **BLD-04:** fuera `ngcc.config.js`, `angular.webpack.js`, `._eslintrc.json`, `polyfills.ts` (ahora `zone.js` directamente) y la línea repetida de `.npmrc`.
- **BLD-06:** fuera `.browserslistrc`: Angular 20 usa su propia lista de navegadores.
- **NUC-05:**
  - fuera `__OPCODES.ts`, `Operation_Register`, `HaltOperation` y la clase `Operation`;
  - el desensamblador de `Utils` y el autocompletado de Monaco usan ahora el repertorio del motor (`engine/isa.ts`);
  - fuera también 4 *pipes*, 3 directivas y 2 componentes que ninguna plantilla usaba.
- **NUC-07:** `core/logger/logger.ts`, con niveles. En desarrollo saca todo y en producción solo avisos y errores; `localStorage.log_level` lo cambia. Los 65 `console.*` de la aplicación pasan por él.
- **BUG-18:** `takeUntilDestroyed` en memoria, inicio de sesión, pie y migas de pan; las demás suscripciones ya se cancelaban. `FileSystemService.init()` ya no acumula una suscripción en cada visita al gestor de ficheros.
- **Comprobado:** 264 pruebas unitarias, 50 e2e y Electron en verde. El paquete inicial pasa de 8,56 MB a 7,63 MB (1,36 MB comprimido) y los avisos de lint, de 61 a 54.

## Fase D. Núcleo

**Objetivo**: un estado único de la máquina, conversiones en un solo módulo y vistas rápidas.

- [x] **NUC-02.** Estado único con *signals*: paso, línea, registros, memoria, pipeline, diagrama, estadísticas y errores.
- [x] **NUC-04.** Modelo de pipeline y diagrama como datos puros; el pintado, en los componentes de Pixi.
- [x] **NUC-06.** Las conversiones de los 19 *pipes*, en `core/numbers.ts`, con pruebas.
- [x] **NUC-08.** Configuración tipada, versionada y validada en un solo sitio.
- [x] **REN-03.** La tabla de código, en bloque y con un `Map` de dirección a etapa.
- [x] **REN-04.** Objetos de Pixi reutilizados y liberados.
- [x] **REN-05.** `OnPush` y *signals* en las vistas de la máquina.

**Resultado**: `MachineService.state` es un conjunto de *signals* de solo lectura (paso, línea, ejecución, fin, punto de ruptura, entrada, salida, errores, código, etapas, pipeline, unidades, estadísticas y las versiones de valores, diagrama y cargas); fuera los 15 `Subject`. El diagrama de ciclos es un modelo de datos (`cycle-diagram.model.ts`) y el componente de Pixi solo pinta lo visible con un `Graphics` y `BitmapText` reutilizados, sigue al último ciclo y se mueve con el teclado solo con el foco. Las conversiones están en `core/numbers.ts` (con pruebas de 0, −0, ±1, π, NaN, ±∞, subnormales y los límites de 32 bits) y los 14 *pipes* en un fichero. La configuración es un objeto validado y versionado (`core/config/config.ts`, clave `thumder_configuration`, migra las 6 claves antiguas) y solo pide confirmación y recarga el programa si cambia algo que use el simulador. Código, registros, memoria, estadísticas y consola con `OnPush`. Verificado: 293 pruebas unitarias, 52 e2e, lint sin errores.

## Fase E. Datos

**Objetivo**: ficheros en el navegador por defecto y sincronización opcional.

- [x] **DAT-01.** Invitado por defecto también con Firebase configurado.
- [x] **DAT-02.** `FileStore` con IndexedDB, y Firestore para sincronizar.
- [x] **DAT-03.** Importar y exportar (`.s`, `.zip`, arrastrar y soltar).
- [x] **DAT-04.** Fechas como número.
- [x] **DAT-05.** Nombres legibles y validados.
- [x] **DAT-06.** Usuario tipado.
- [x] **SEG-04.** `firestore.rules` y `firebase.json`; verificar en la consola de Firebase.

**Resultado**: el simulador se abre sin cuenta (fuera `AuthGuard`); el usuario es una *signal* (`AuthService.user`, `isGuest`) y la cuenta solo sincroniza. Los ficheros están siempre en IndexedDB (`file-store.ts`, migra `local_file_items`) y, con cuenta, también en Firestore: `mergePlan` (con pruebas) une las dos copias por `key`, gana la versión más nueva, y las bajas de este dispositivo (lápidas) y de otros (`syncedAt`) no resucitan; al cerrar sesión se sincroniza y, si no hay conexión, no se borra nada. Fechas en milisegundos, nombres legibles y validados («nuevo (2).s»), importar `.s`, `.txt` y `.zip` (ZIP propio sin dependencias, con *deflate*) y descargar un fichero o una carpeta en `.zip`. El gestor de ficheros ya no usa Angular Material, ni `prompt`, `alert` o `confirm`. `firestore.rules` con 13 pruebas en el emulador (`pnpm test:rules`), hechas con los documentos que escribe la propia aplicación (`remoteFile`, el perfil de `AuthService`) y con los de las versiones anteriores. Revisión posterior: los ficheros y los perfiles solo admiten sus campos (`hasOnly`) y el perfil su propio `uid`; borrar un fichero que nunca llegó a la cuenta ya no es un error; los nombres nuevos caben siempre en 100 caracteres; y un fichero que la cuenta rechaza ya no detiene la sincronización de los demás ni se marca como sincronizado (se probó con una cuenta falsa). `@angular/fire` 20.1 y `firebase` 11.10. Verificado: 323 pruebas unitarias, 56 e2e. Pendiente para quien mantenga el proyecto: publicar las reglas (`firebase deploy --only firestore:rules`) y revisarlas en la consola de Firebase.

## Fase F. Simulación y didáctica

**Objetivo**: lo que diferencia a THUMDER de WinDLX.

- [x] **UI-04.** Control de velocidad y «ejecutar hasta el final sin dibujar».
- [x] **EDU-03.** Paso atrás.
- [x] **EDU-01.** Explicar cada atasco.
- [x] **EDU-02.** Comparar con y sin adelantamiento.
- [x] **UI-06.** Panel de problemas del ensamblador.
- [x] **NUC-10.** Elegir los módulos de un programa.
- [x] **NUC-11.** Símbolos, puntos de ruptura por etapa e historial del diagrama.
- [x] **EDU-04.** Galería de ejemplos con preguntas que se comprueban.
- [x] **EDU-05.** Ruta de datos resaltada.
- [x] **EDU-06.** Exportar el diagrama y las estadísticas.
- [x] **EDU-07.** Compartir un ejercicio por enlace.

**Resultado**: en la barra, la velocidad (también durante la ejecución), «ejecutar hasta el final sin dibujar» (F8) y «paso atrás» (Mayúsculas+F10), que repite la ejecución hasta el ciclo anterior con un diario de lo que hizo la persona (entrada, registros, memoria) y deja el estado idéntico (probado). El motor explica cada atasco (registro, instrucción que lo produce y si el adelantamiento lo habría evitado) y el diagrama lo cuenta al hacer clic o con «atasco anterior/siguiente»; guarda un historial configurable (100 a 100.000 ciclos) y se exporta en SVG, PNG y CSV. Las estadísticas comparan el programa con y sin adelantamiento y se descargan en CSV. En el editor: panel de problemas (cada línea lleva al error), módulos elegidos a mano, ventana de símbolos, puntos de ruptura por etapa (IF, ID, EX, MEM, WB) y vigilancia de lecturas y escrituras de memoria, y compartir como ejercicio con un enlace (comprimido, sin servidor) que bloquea opciones. Galería de 8 ejercicios guiados por tema con preguntas que se comprueban con la simulación, y una ruta de datos propia (la de `assets/Datapath_Schematic.svg` es de otro procesador, con BTB y PC+8) que resalta cada etapa y el adelantamiento usado. Verificado: 348 pruebas unitarias y 12 e2e nuevas.

## Fase G. Interfaz, accesibilidad e idiomas

**Objetivo**: un solo sistema de interfaz, accesible y traducido.

- [x] **UI-01.** Un solo sistema: fuera Angular Material como sistema visual, Covalent y Material Icons.
- [x] **UI-05.** Una sola vista múltiple: fuera `grid-view`.
- [x] **UI-07.** Tema oscuro (también en Monaco, xterm y Pixi).
- [x] **UI-09.** El diagrama solo escucha el teclado cuando tiene el foco.
- [x] **UI-10.** Avisos útiles y una barra de estado.
- [x] **A11Y-01.** Alternativa en tabla al diagrama y descripción del pipeline.
- [x] **A11Y-02.** Elementos interactivos de verdad.
- [x] **A11Y-03.** Botones de icono con nombre traducido.
- [x] **A11Y-04.** No depender solo del color.
- [x] **I18N-03.** Textos fijos traducidos.
- [x] **I18N-04.** Aviso del idioma de la documentación.

**Resultado**: fuera Angular Material, Covalent, Material Icons, `ng-table-virtual-scroll`, `angular-gridster2` y la vista `grid-view` (su ruta lleva a la vista múltiple). Las tablas de código, registros y memoria usan una tabla virtual propia sobre el CDK (`thumder-virtual-table`, con roles de tabla y desplazable con el teclado) y Monaco se crea directamente, con la hoja de estilos de su versión (la de `src/monaco-editor.scss` era de la 0.22). Tema claro, oscuro o el del sistema (`ThemeService`, también en Monaco y en los lienzos). Barra de estado en el pie (estado, ciclo, línea e instrucción, anunciada al parar) y avisos unificados (`TOAST`), sin aviso en cada carga. El diagrama tiene una vista en tabla y el pipeline una descripción en texto. axe (WCAG 2.1 A y AA) sin ninguna regla pendiente en 18 vistas y en los dos temas: contraste de 4,5:1 (azules y grises más oscuros), botones con nombre traducido, títulos de tarjeta que son botones, menú lateral como lista. Textos traducidos en las plantillas (404, menú, modales, calculadora, formularios) y cada documento dice su idioma. Verificado: 348 pruebas unitarias, 89 e2e, lint sin errores.

## Fase H. Rendimiento, seguridad y publicación

**Objetivo**: un paquete más ligero y una aplicación de escritorio más segura.

- [x] **REN-02.** Monaco solo con el lenguaje DLX; Pixi y Chart.js en sus vistas.
- [x] **REN-06.** Fuera de la compilación las GIF de la wiki (116 MB).
- [x] **SEG-03.** CSP en `index.html`.
- [x] **SEG-06.** electron-builder actualizado y empaquetado probado.
- [x] **CI-03.** Publicación por plataforma: macOS, `latest.yml` y notas del CHANGELOG. La firma necesita certificados.

**Resultado**: paquete inicial de 7,77 MB a 3,07 MB (de 1,43 MB a 536 KB transferidos): cada vista del simulador se carga al abrirse, Monaco sin sus 80 lenguajes solo con el editor, PixiJS con sus lienzos (sin `main.ts`), fuera `emoji-toolkit` y la ruta de pruebas `/monaco`. Las GIF de la wiki (116 MB) ya no se empaquetan: la documentación las carga de la wiki en GitHub. CSP en `index.html` (sin `eval`, gracias a `@pixi/unsafe-eval`, y sin scripts en línea; se quitó el CSS crítico en línea de Angular, que usa `onload`), y «Sobre nosotros» lee las licencias de un fichero local (`scripts/licenses.mjs`) en vez de pedir a unpkg.com una por dependencia. electron-builder 26 con un paquete que solo lleva `main.js`, `preload.js` y la aplicación (`app.asar` de 17,7 MB), sin recompilar módulos nativos (el `postinstall` antiguo recompilaba para Electron los de las herramientas de Angular y rompía la compilación); empaquetado para Linux probado y arrancado. Angular 20.3.34 y versiones corregidas de vite, grpc-js, `@babel/runtime` y el SDK de MCP: `pnpm audit` (todas las dependencias, también las de desarrollo) pasa de 61 avisos (2 críticos y 13 altos) a ninguno: vitest 4, wait-on 9, dompurify 3.4.17, fuera electron-reload (Electron se reinicia solo con `fs.watch`) y los complementos que no se usan (summernote y sweetalert2 de AdminLTE, katex y mermaid de ngx-markdown, karma, global-agent), y para firebase-tools chokidar 4 y `@opentelemetry/core` 2 (`pnpm.overrides`). Publicación: borrador con Linux, Windows (instalador y portable) y macOS (dmg y zip), los `latest*.yml` y las notas del CHANGELOG (`scripts/release-notes.mjs`), que avisan de que los binarios no están firmados.

## Fase I. Documentación y cierre

- [x] **DOC-02.** Fuera los ficheros que sobran.
- [x] **DOC-04.** Guía de contribución.
- [x] README, `docs/` y `TODO-mejoras.md` al día; verificación final completa.

**Resultado**: fuera `generate-uml.cmd` (solo Windows y escribía en una carpeta que no existe) y un *script* de `package.json` con un nombre roto; `firebase.json` ya tiene contenido (SEG-04) y `UML/` se queda como documentación histórica con un README que dice en qué ya no coincide con el código. `CONTRIBUTING.md` con la estructura, las convenciones, las pruebas y cómo publicar; README y `docs/simulador.md` al día (protocolo del Worker con velocidad, puntos de ruptura por etapa y de memoria, paso atrás, explicación de atascos y comparación). La integración continua prueba también las reglas de Firestore.

**Verificación final** (16 de octubre de 2026): `pnpm run lint` sin errores; 348 pruebas unitarias; 6 de las reglas de Firestore en el emulador; 89 e2e en escritorio, móvil y tableta (con axe en los temas claro y oscuro, sin reglas pendientes); el e2e de Electron con la compilación de producción y la CSP; el paquete de Linux de electron-builder arranca. Paquete inicial de la web: 3,07 MB (537 KB transferidos).

**Pendiente fuera del código** (no se puede hacer desde aquí): publicar las reglas en Firebase (`firebase deploy --only firestore:rules`) y revisarlas en su consola, firmar los binarios (hacen falta certificados de Windows y de Apple). Con Angular 21 desaparece el aviso de dependencias de `@angular/build` 20, que pide vitest 3 (funciona con vitest 4: 348 pruebas).
