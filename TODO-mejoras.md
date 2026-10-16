# THUMDER: análisis y plan de mejoras

Análisis de la rama `dev` (commit `aef03a1`, 15 de octubre de 2026). Cubre el núcleo de la simulación, la interfaz, Electron, los datos, las pruebas, la compilación, la integración continua y la documentación. Al final hay un plan por fases con objetivos y criterios de terminado.

Cómo se ha hecho: lectura del código de `src/app` y `main.ts`, `pnpm install`, `pnpm run ng:build:dev`, `pnpm run lint`, `pnpm test` y comprobaciones en Node de las conversiones numéricas sospechosas. No se ha probado contra THUMDER-server, así que lo que depende de sus respuestas va marcado como **(verificar)**.

## Resumen

THUMDER funciona como prototipo: compila en unos 4 s y tiene un editor con resaltado, autocompletado y errores, un pipeline, un diagrama de ciclos, registros, memoria y estadísticas. Los cinco problemas que más pesan:

1. **Hay fallos de cálculo en el núcleo**: los `double` pierden precisión o se desalinean, los `float` y `double` se escriben mal en memoria y el registro de mensajes pierde los parámetros. Para un simulador con fines didácticos, enseñar valores incorrectos es el peor fallo posible.
2. **La seguridad de Electron**: el proceso de la ventana tiene acceso a Node (`nodeIntegration: true`, `contextIsolation: false`) y el Markdown se pinta sin sanear. Cualquier HTML inyectado podría ejecutar código en el ordenador del estudiante.
3. **No hay red de seguridad**: las pruebas unitarias no compilan, las e2e usan Spectron (abandonado) y Cypress 9, y la integración continua solo corre al publicar una etiqueta, con Node 14 y scripts que ya no existen.
4. **La simulación depende de un servidor externo y de una cuenta de Firebase**: sin THUMDER-server no se simula, y sin iniciar sesión no se entra al simulador. THUMDER-server está escrito en TypeScript, así que el motor podría correr en el navegador (en un Web Worker), sin servidor y sin conexión.
5. **La interfaz mezcla varios sistemas**: AdminLTE 3 con jQuery, Angular Material y Covalent, más restos de plantillas (un perfil falso, imágenes sin usar y menús con `log('TODO')`). El paquete de producción sale **sin optimizar** (unos 18,5 MB iniciales).

### Progreso (16 de octubre de 2026)

Hechas todas las tareas: 115 de 115 (`[x]`), cerradas por fases en [TODO-cierre.md](TODO-cierre.md), donde está la verificación final y lo que queda fuera del código (publicar las reglas de Firestore, firmar los binarios).

Lo que sigue es el registro de los primeros avances (15 de octubre de 2026). Comprobado entonces:

- `pnpm run lint` sin errores, 260 pruebas unitarias en verde y compilaciones de desarrollo, producción y Electron;
- en Chromium sin ventana, contra THUMDER-server: se carga `prim.s`, cinco F10 hacen cinco pasos, F5 ejecuta y al pausar no sale ningún paso más, sin errores de consola;
- en Electron (pantalla virtual): carga `dist/browser`, tiene `window.thumder` y la página no tiene acceso a Node (`window.require` y `window.process` no existen).

**Simulador propio** (15 de octubre de 2026): THUMDER ya ensambla en código máquina DLX real y simula ciclo a ciclo sin servidor (NUC-03, `docs/simulador.md`). Comprobado en el navegador: `gcm.s` con `input.s` pide los números en la consola e imprime `gcM=12` para 84 y 36; `prim.s` deja los primos en memoria; los errores de ensamblado se marcan en su línea del editor. Los ejemplos `gcm.s`, `input.s`, `fact.s` y `prim.s` estaban pasados a mayúsculas (sus `printf` no funcionaban): restaurados desde el manual.

**Después de quitar jQuery** (15 de octubre de 2026):

- Fuera los últimos apaños de `resize`.
- Zoom en los lienzos (UI-08).
- Se resaltan los bloques `bash` y `json` de la documentación: faltaban esos lenguajes de Prism.
- **BUG-27, corregido:** la vista de registros no mostraba el PC de cada ciclo. El pipeline lo cambiaba, pero no lo anotaba entre los cambios del ciclo.

Comprobado con 32 interacciones en Chromium.

**Sin jQuery** (15 de octubre de 2026): UI-02 hecha por fases ([TODO-jquery.md](TODO-jquery.md)). La interfaz funciona igual sin jQuery, Bootstrap JS ni AdminLTE JS (25 comprobaciones en Chromium y 5 en Electron), y los scripts globales pasan de 1,12 MB a 0,54 MB.

**Simulador en un Web Worker y ejemplos** (15 de octubre de 2026): el ensamblado, la simulación y el bucle de ejecución corren en un Web Worker (NUC-09). Hay 20 ejemplos clásicos comentados en `src/assets/examples-dlx/ejemplos/` (`docs/ejemplos-dlx.md`), que se añaden desde el gestor de ficheros; las pruebas comprueban la salida de cada uno y lo que dicen sus comentarios sobre el pipeline.

### Estado medido (al empezar)

| Comprobación | Resultado |
| :-- | :-- |
| `pnpm install` | Bien, con avisos de dependencias pensadas para otra versión de Angular (19, 21 o 12) |
| `pnpm run ng:build:dev` | Bien, 18,52 MB iniciales |
| `pnpm run lint` (Biome) | 2 errores, 100 avisos y 25 notas (82 `any`, 18 `!`, 25 constructores vacíos) |
| `pnpm test` (Karma) | **No compila**: TS1286/TS1287 por `module: commonjs` junto con `verbatimModuleSyntax` |
| e2e | Spectron (no funciona con Electron 14 o posterior) y Cypress 9 con `cypress.json` (formato anterior a la versión 10) |
| Integración continua | Solo con etiquetas `v*`: Node 12/14, `npm install`, `ng:build-angular:production` (ya no existe) y `dist-angular` (ya no se genera) |
| Electron | `">=16.2.6"` sin fijar, que se resuelve a la 44.7.2, con electron-builder 23 (de 2022) |

### Métricas del código

| Medida | Valor |
| :-- | :-- |
| TypeScript de la aplicación (sin pruebas) | unas 11.900 líneas en 126 ficheros |
| `console.*` | 113 |
| `any` | 72 |
| `.substr(` (obsoleto) | 46 |
| Componentes no independientes (`standalone: false`) | 69 |
| Constructores que dejó la migración a `inject()` | 40 |
| Usos de jQuery | 23 en 11 ficheros (0 desde UI-02) |
| `(click)` en elementos que no son botones ni enlaces | 51 |
| `OnPush` o signals | 0 |

Leyenda de severidad: **Alta** (resultados incorrectos, pérdida de datos o riesgo de seguridad), **Media** (funciona mal o frena el desarrollo) y **Baja** (limpieza o pulido).

---

## 1. Fallos confirmados

- [x] **BUG-01. El registro pierde los parámetros** (Media). `stringFormat` compara el índice de la expresión regular, que es texto (`"0"`), con `TypeLogger.index`, que es un número, así que nunca coinciden y todos los `{0}` se sustituyen por `""`. Comprobado: `"payload S: {0}"` sale como `"payload S: "`. Hay que convertirlo con `Number(index)`. [machine.service.ts:519](src/app/__core/machine/machine.service.ts#L519)
- [x] **BUG-02. Los `float` y `double` se escriben mal en memoria** (Alta). `setMemory_stringBinary_ByIndex` usa `index + (pos % 8)`, pero `pos` siempre es múltiplo de 8, así que todos los bytes van a la misma dirección y solo sobrevive el último. Comprobado: π en `double` deja `[24, 0, 0, 0, 0, 0, 0, 0]`. Debe ser `index + pos / 8`. [ManagerMemory.ts:217](src/app/__core/DLX/ManagerMemory.ts#L217)
- [x] **BUG-03. Los `double` pasan por `Number`** (Alta). `Utils.hexadecimalToBinary` usa `parseInt` y `padStart(32)`. Con 16 cifras hexadecimales:
  - se pierden los bits bajos (π acaba en `…0010110000000000` en vez de `…0010110100011000`);
  - si los bits altos son 0 (1,0 es `0x3FF0…`), el binario queda en 62 bits, `substr(0, 32)` corta mal y `Float32.binary` lanza una excepción porque la longitud no es 32.

  Hay que convertir cifra a cifra (cada cifra hexadecimal son 4 bits) o con `BigInt`, y rellenar hasta 64 bits. [Utils.ts:140](src/app/Utils.ts#L140), [ManagerRegisters.ts:81](src/app/__core/DLX/ManagerRegisters.ts#L81), [ManagerMemory.ts:102](src/app/__core/DLX/ManagerMemory.ts#L102)
- [x] **BUG-04. `Float32.hexValue` trata el `float` como si fuera un entero** (Media). El getter devuelve `3.14.toString(16)`, que es `"3.23d70a3d70a3e"`, y el setter usa `parseInt` en vez de los bits IEEE 754. [TypesData.ts:35](src/app/__core/TypesData.ts#L35)
- [x] **BUG-05. Los pasos de la simulación se pisan** (Alta). El `interval` (250 ms por defecto) pide `SimulationNextStepRequest` sin esperar la respuesta anterior y con `step: privateStep + 1`, que solo se actualiza al llegar la respuesta. Si el servidor tarda más que el intervalo, se piden pasos repetidos o desordenados. Hay que encadenar las peticiones (pedir la siguiente solo al recibir la respuesta) o usar `exhaustMap`. [machine.service.ts:157](src/app/__core/machine/machine.service.ts#L157), [machine.service.ts:403](src/app/__core/machine/machine.service.ts#L403)
- [x] **BUG-06. Al cambiar la URL del servidor se pierden los eventos** (Alta). `updateSocketURl` crea un `Socket` nuevo, pero los manejadores de `connect`, `disconnect` y errores (en el servicio del socket) y los de `Update*Response` (en `MachineService`) siguen en el socket viejo. Además modifica la constante `CONFIG_WEBSOCKET`. [socket-provider-connect.service.ts:97](src/app/__core/services/socket/socket-provider-connect.service.ts#L97)
- [x] **BUG-07. Se modifican constantes compartidas** (Media):
  - `ManagerStatistics` guarda `DEFAULT_DATA_STATISTICS` por referencia y `processResponse` lo modifica ([ManagerStatistics.ts:10](src/app/__core/DLX/ManagerStatistics.ts#L10));
  - `MachineService.enabledForwarding` y `ConfigView` enlazan `ngModel` a los objetos `DEFAULT_*`;
  - el socket modifica `CONFIG_WEBSOCKET`.

  Hay que usar `structuredClone` y `Object.freeze` en las constantes.
- [x] **BUG-08. La vista múltiple añade entradas `"undefined"`** (Media). `ngAfterViewInit` hace `push(...String(d.data))` con `CdkDrag` que no tienen datos, en el mismo array que la configuración, y lo hace en cada visita. [multiples-views.component.ts:37](src/app/views/_auth/_views/multiples-views.component.ts#L37). Además:
  - `Globals.drop` mueve a la vez los datos y el DOM a mano y usa la API privada `_dragRef._withDropContainer` ([globals.service.ts:24](src/app/__core/services/globals/globals.service.ts#L24));
  - el orden nuevo no se guarda.
- [x] **BUG-09. Los diagramas solo avanzan si su vista está abierta** (Alta). El pipeline y el diagrama de ciclos se suscriben a los pasos en el `ngOnInit` del componente. Si se simula desde otra vista, el diagrama se queda incompleto, y si se monta dos veces, se duplica. El estado debe vivir en el servicio y la vista solo debe pintarlo. [pixi-cycle-clock-diagram.component.ts:46](src/app/components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component.ts#L46), [pixi-pipeline.component.ts:50](src/app/components/pixi-pipeline/pixi-pipeline.component.ts#L50)
- [x] **BUG-10. El diagrama de ciclos no pinta las unidades de coma flotante** (Media). `nextStep` solo recorre IF, ID, intEX, MEM y WB, así que `faddEX`, `fmultEX` y `fdivEX` no aparecen nunca. [PixiTHUMDER_CycleClockDiagram.ts:183](src/app/__core/machine/PixiTHUMDER_CycleClockDiagram.ts#L183) Hecho en el cliente; THUMDER-server todavía no simula las unidades de coma flotante (SRV-04).
- [x] **BUG-11. Cerrar sesión borra todo el `localStorage`** (Media). Se pierden la configuración, los puntos de ruptura, el fichero abierto y la vista múltiple. Solo hay que borrar las claves de la sesión. [auth.service.ts:189](src/app/__core/auth/auth.service.ts#L189) Hecho: se borran la sesión, el fichero abierto y los puntos de ruptura (trabajo personal en un ordenador compartido) y se conservan las preferencias.
- [x] **BUG-12. La aplicación Electron empaquetada apunta a una ruta que no existe** (Alta, verificar empaquetando). `main.ts` carga `dist/index.html` y el icono de la bandeja desde `dist/assets/…`, pero el builder `application` genera `dist/browser/…`. Además, `electron-builder.json` excluye `package.json` e incluye `**/*` (cypress, UML, wiki…). [main.ts:39](main.ts#L39), [main.ts:67](main.ts#L67) Hecho y comprobado arrancando Electron en una pantalla virtual. Además estaba roto el script `build:prod` (pasaba `--` a `ng build`).
- [x] **BUG-13. Al borrar una carpeta, sus ficheros quedan huérfanos** (Media). Solo se borra el documento de la carpeta, no su contenido, y `moveItem` deja mover una carpeta dentro de una de sus subcarpetas. [file-system.service.ts:161](src/app/__core/services/file-system/file-system.service.ts#L161)
- [x] **BUG-14. El estado de la conexión siempre sale "Connect"** (Baja). `getStatusWebsocket` compara `id === ""`, pero sin conexión el `id` es `undefined`. Mejor usar `ioSocket.connected`. [machine.service.ts:294](src/app/__core/machine/machine.service.ts#L294)
- [x] **BUG-15. Fuera de rango en registros y memoria** (Baja):
  - un `Double` en `F31` escribe en `F[32]` y no se exige que el registro sea par;
  - el getter `memorySizeBytes` multiplica por 4 sin motivo;
  - `getAllMemoryWord` recorre hasta `<=` el tamaño (una palabra de más);
  - las lecturas no comprueban límites (`undefined.toString` si la dirección se sale).

  [ManagerRegisters.ts:137](src/app/__core/DLX/ManagerRegisters.ts#L137), [ManagerMemory.ts:18](src/app/__core/DLX/ManagerMemory.ts#L18)
- [x] **BUG-16. `processResponseMachineDirectives` no hace nada** (verificar). Todos los `case` terminan en `break`, así que `.data`, `.word`, `.float`… dependen de que el servidor mande la memoria en `runner`. [ManagerMemory.ts:27](src/app/__core/DLX/ManagerMemory.ts#L27) Comprobado: THUMDER-server no envía los datos de las directivas (solo un ejemplo inventado para `prim.s`), ver SRV-06. Resuelto con el simulador local: las directivas se ensamblan y sus datos llegan a la vista de memoria antes del primer ciclo.
- [x] **BUG-17. Los avisos de la máquina duran 500 ms** (Baja). No da tiempo a leerlos, y salen en cada reinicio y en cada punto de ruptura. [machine.service.ts:563](src/app/__core/machine/machine.service.ts#L563)
- [x] **BUG-18. Suscripciones sin cancelar** (Baja). `ConfigView` se suscribe a `watchStorage()` en cada visita sin darse de baja ([config.view.ts:65](src/app/views/_auth/config/config.view.ts#L65)). Hay que revisar las 35 `subscribe` y pasarlas a `takeUntilDestroyed`. En parte: arreglada la vista de configuración y la barra de navegación; quedan por revisar el resto de suscripciones. Hecho: `takeUntilDestroyed` donde faltaba y una sola suscripción en `FileSystemService.init()`.
- [x] **BUG-19. Encadenamiento frágil al reiniciar** (Media). `SimulationInit` devuelve `false` en cuanto emite, y `resetMachineStatus` vacía `this.code` después. Funciona solo porque la respuesta llega en otra vuelta del bucle de eventos. Hay que convertir el emit en una promesa con `ack` y tiempo de espera. [machine.service.ts:358](src/app/__core/machine/machine.service.ts#L358)
- [x] **BUG-20. Texto fijo y con una errata** (Baja): `"Email send, heck your inbox."`. [auth.service.ts:131](src/app/__core/auth/auth.service.ts#L131)
- [x] **BUG-21. El modal de memoria escribía ceros** (Alta, encontrado al arreglar). Al cambiar el tipo de dato, o ante cualquier error, ponía a cero la memoria de la dirección seleccionada. Además leía una palabra cuando se pedía media palabra, aceptaba direcciones hasta 4 veces el tamaño de la memoria y convertía mal los negativos. Ahora lee siempre de la memoria y solo escribe valores válidos (`src/app/__core/DLX/typeDataValues.ts`).
- [x] **BUG-22. Las respuestas `UpdateRegisterResponse` y `UpdateMemoryResponse` rompían** (Media, encontrado al arreglar). El servidor manda un objeto y el cliente lo recorría como si fuera un array. Ahora se aplica la respuesta de la petición, con los valores que guarda el servidor.
- [x] **BUG-23. Editar un registro entero o de coma flotante rompía el servidor** (Alta, encontrado al arreglar). El modal mandaba el registro como número y THUMDER-server hace `register.replace(...)`. Ahora el cliente manda el nombre (`R5`, `F4`).
- [x] **BUG-24. Los bytes y las medias palabras se escribían con los bits altos** (Media, encontrado al arreglar). Con un valor de 32 bits se quedaban con los primeros 8 o 16 bits, que son ceros.
- [x] **BUG-25. Los `double` que manda el servidor rompían el cliente** (Alta, encontrado al arreglar). THUMDER-server manda cada mitad como una entrada de 32 bits (`F4`, `F5`) y el cliente esperaba 64 bits: `Float32.binary` lanzaba una excepción. Ahora se aceptan los dos formatos.
- [x] **BUG-26. Sin claves de Firebase la aplicación no arrancaba** (Alta, encontrado al arreglar). Quedaba en blanco con `auth/invalid-api-key`. Ver DAT-01.
- [x] **BUG-27. La vista de registros no seguía el PC** (Media, encontrado al quitar jQuery). En el simulador local, el setter `nextPC` del pipeline cambiaba el PC pero no lo anotaba entre los cambios del ciclo, y la vista se quedaba con la dirección de entrada. Corregido en `pipeline.ts`, con una prueba que sigue el PC ciclo a ciclo, también tras un salto.
- [x] **BUG-28. Un punto de ruptura quitado seguía parando la ejecución** (Media, encontrado al escribir las e2e). El editor guarda los puntos quitados con `false` y `ManagerBreakpoints.getAllLinesWithBreakpoints` devolvía todas las líneas, así que el Worker se paraba también en esas. Corregido, con una prueba unitaria y una e2e.
- [x] **BUG-29. Una memoria más pequeña que el programa rompía la página** (Media, encontrado al escribir las e2e). `MachineService` mandaba la configuración al simulador después de ensamblar, así que se ensamblaba con el tamaño anterior y los datos no cabían en la memoria de la página (`RangeError`). Ahora la configuración va antes y un programa que no cabe es un error de ensamblado.
- [x] **BUG-30. Renombrar una carpeta dejaba huérfano su contenido** (Media, encontrado al arreglar). Solo cambiaba el nombre de la carpeta, no la ruta de sus ficheros. Corregido en `FileSystemService.renameItem`, con prueba; además, al cargar se crean las carpetas que falten (`missingFolders`).
- [x] **BUG-31. Guardar desde el editor no guardaba si no se había abierto antes el gestor de ficheros** (Alta, encontrado al arreglar). `editFileItem` solo buscaba el fichero en la lista que carga el gestor. Ahora lo busca en el almacén y, si se borró mientras tanto, lo crea de nuevo.
- [x] **BUG-32. Instalar dependencias rompía la compilación** (Alta, encontrado al arreglar). El `postinstall` ejecutaba `electron-builder install-app-deps`, que recompilaba para Electron los módulos nativos de las herramientas de Angular (lmdb, msgpackr, watcher) y Node se caía al compilar para producción. La aplicación no tiene módulos nativos: fuera ese paso y `npmRebuild: false`.
- [x] **BUG-33. La CSP dejaba la versión de producción sin estilos** (Alta, encontrado al arreglar). Angular inserta el CSS crítico con un `onload` en línea que la CSP bloquea. Desactivado `inlineCritical`; lo comprueba el e2e de Electron, que usa la compilación de producción.

## 2. Seguridad

- [x] **SEG-01. Electron sin aislamiento** (Alta). `nodeIntegration: true`, `contextIsolation: false` y sin `sandbox` ([main.ts:24](main.ts#L24)). Hay que pasar a un `preload` con `contextBridge` que exponga solo lo necesario (abrir enlaces externos, notificaciones y ficheros), activar `contextIsolation: true` y `sandbox: true`, y quitar `window.require` del código Angular (`ElectronService`, el renderizador de enlaces y `webview.directive`).
- [x] **SEG-02. Markdown sin sanear** (Alta). `sanitize: SecurityContext.NONE` y un renderizador de enlaces que mete el `href` en un `onclick` escapando solo `'`, con el `title` sin escapar ([app.module.ts:145](src/app/app.module.ts#L145), [app.module.ts:206](src/app/app.module.ts#L206)). Hay que activar el saneado y resolver los enlaces externos en el proceso principal (`setWindowOpenHandler` y `will-navigate` con `shell.openExternal` para `https:`).
- [x] **SEG-03. La navegación de Electron no está restringida** (Media). No hay manejadores `will-navigate` ni `setWindowOpenHandler`, ni CSP en `index.html`. Además, `allowRunningInsecureContent` está activo en desarrollo y `electron-reload` se carga con `require` dinámico. En parte: navegación restringida y enlaces externos al navegador del sistema (`main.ts`); falta la CSP. Hecho (fase H de TODO-cierre.md): CSP en `index.html` para la web y Electron, sin `unsafe-eval` ni scripts en línea; comprobada en todas las vistas (e2e) y en Electron.
- [x] **SEG-04. No hay reglas de Firestore en el repo** (Alta, verificar en la consola de Firebase). El `AuthGuard` solo mira `localStorage.user`, lo que vale para la experiencia de uso pero no protege nada, y `firebase.json` es `{}`. Hay que añadir `firestore.rules` con `resource.data.e1_uid == request.auth.uid` y probarlas con el emulador. Hecho: `firestore.rules` (cada persona solo lee y escribe sus ficheros y su perfil, con los campos, tipos y tamaños de THUMDER), `firebase.json` y `test/firestore.rules.spec.ts` con el emulador (`pnpm test:rules`, 13 pruebas con los documentos que escribe la aplicación). Falta publicarlas en el proyecto de Firebase.
- [x] **SEG-05. Se inicializan servicios de Firebase que no se usan** (Media). Messaging, Performance, Remote Config, Functions, Database y Storage no se usan en ningún sitio, y Analytics arranca sin consentimiento (el `cookieConfig` tiene `enabled: false`). Hay que dejar solo Auth y Firestore, y Analytics solo tras aceptar las cookies. [app.module.ts:224](src/app/app.module.ts#L224) Corrección: Remote Config sí se usa (`translationEnabled` en las páginas de cuenta) y se conserva. Hecho: fuera Storage, Database, Functions, Messaging y Performance; aviso de cookies con aceptación explícita en la web; Analytics solo tras «permitir».
- [x] **SEG-06. Versiones de Electron sin fijar** (Media). Hay que fijar Electron a una versión con soporte, actualizar electron-builder y revisar `pnpm audit`. En parte: Electron fijado a 44.7.2; falta actualizar electron-builder (23) y probar el empaquetado. Hecho: electron-builder 26, paquete sin `node_modules` ni recompilación de módulos nativos, empaquetado de Linux probado; `pnpm audit` sin ningún aviso, también en las dependencias de desarrollo (detalle en TODO-cierre.md).

## 3. Núcleo y arquitectura de la simulación

- [x] **NUC-01. Un protocolo con tipos y promesas** (Alta). Hay que envolver `emitMessage` en `request<TReq, TRes>(event, payload, { timeout })` que devuelva una promesa, valide la respuesta (con un `JSON.parse` protegido) y muestre los errores en la interfaz. Ahora los `JSON.parse` de las respuestas no tienen `try/catch` y `updateRegisterInServer` y `updateMemoryInServer` devuelven `true` antes de saber si ha ido bien.
- [x] **NUC-02. Un único estado de la máquina** (Alta). `MachineService` tiene más de 15 `Subject` y cada vista reconstruye su parte del estado. Hay que pasar a un estado único (signals o un store) con el paso, la línea, los registros, la memoria, el pipeline, el diagrama, las estadísticas y los errores. Las vistas solo lo leen. Esto arregla BUG-09 y prepara el «paso atrás». En parte: el pipeline y el diagrama de ciclos ya se actualizan en el servicio (BUG-09). Hecho (fase D de TODO-cierre.md): `MachineService.state` reúne en *signals* el paso, la línea, el pipeline, el diagrama, las estadísticas, la salida, los errores y las versiones de registros y memoria; las vistas solo lo leen.
- [x] **NUC-03. Motor local en un Web Worker** (Alta, decisión estratégica). THUMDER-server está en TypeScript. Se puede empaquetar su núcleo como librería (o junto a `thumder-ontology`) y ejecutarlo en un Web Worker con el mismo protocolo. Así se consigue: Hecho: el motor está en `src/app/__core/engine/` (ensamblador, CPU, pipeline, traps) y es la opción por defecto; THUMDER-server queda como alternativa en la configuración. Corre en un Web Worker (NUC-09). Documentado en `docs/simulador.md`.
  - una versión web sin servidor y sin conexión;
  - un Electron sin proceso aparte;
  - pruebas deterministas.

  El modo servidor quedaría como opción. Ver «Decisiones abiertas».
- [x] **NUC-04. Separar el modelo de Pixi** (Media). `MachineService` crea `PixiTHUMDER_Pipeline` y `PixiTHUMDER_CycleClockDiagram`, que son objetos gráficos, dentro del servicio. El modelo (qué instrucción está en cada etapa y en cada ciclo) debe ser datos puros y el pintado debe ir en el componente. Hecho: `CycleDiagramModel` (datos puros, con pruebas) y el pipeline como `TypePipelineInstructions`; cada componente de Pixi crea y libera sus objetos.
- [x] **NUC-05. Quitar el código muerto del núcleo** (Baja): Corrección: `__OPCODES.ts` sí se usa (el desensamblador de `Utils` y el autocompletado de Monaco); lo que no se usa es la lógica de `Operation_Register` y `HaltOperation`. Hecho: fuera `processResponsePipeline` y la asignación repetida. Hecho: fuera `__OPCODES.ts` y sus clases; el desensamblador y el autocompletado usan `engine/isa.ts`. Fuera también 4 *pipes*, 3 directivas y 2 componentes sin uso.
  - `__OPCODES.ts`, `Operation_Register`, `HaltOperation` y las clases `InstructionType*` (la simulación está en el servidor);
  - `processResponsePipeline`, que es `Utils.voidF()`;
  - `statusMachineInStep = DEFAULT_STEP_SIMULATION`, que se sobrescribe en la línea siguiente;
  - los manejadores comentados.
- [x] **NUC-06. Conversiones numéricas en un único módulo probado** (Alta). `Utils.ts` (380 líneas), `TypesData.ts` y 19 *pipes* repiten conversiones binario/hexadecimal/IEEE 754. Hay que reunirlas en `core/numbers.ts` con `DataView` y `BigInt`, y cubrirlas con pruebas de valores conocidos (0, −0, 1, −1, π, NaN, ±∞, subnormales, `0x7FFFFFFF`, `0x80000000`). También hay que quitar los `substr`. En parte: conversiones exactas con BigInt y `DataView` y pruebas de valores conocidos; falta juntar los 19 *pipes* en un módulo. Hecho: `core/numbers.ts` reúne las conversiones (y `Utils.ts` queda en 50 líneas); los 14 *pipes* están en `numbers.pipes.ts` y llaman a ese módulo; fuera los `substr`.
- [x] **NUC-07. Un registro con niveles** (Baja). El nivel está fijado a `EnumLogLevel.All` y hay 113 `console.*`. Hay que crear un `LoggerService` con nivel configurable, que en producción no saque `debug`. Hecho: `core/logger/logger.ts` con niveles (todo en desarrollo, avisos y errores en producción, `localStorage.log_level` para cambiarlo); los `console.*` de la aplicación pasan por él.
- [x] **NUC-08. La configuración, validada en un solo sitio** (Media). Hay que juntar las 9 claves de `localStorage` en un objeto tipado y versionado (con migraciones), validar rangos (unidades de coma flotante de 1 a 8, retardos de 1 a 50, tamaño de memoria) y guardar los cambios sin reiniciar la máquina sin avisar. Hecho: `core/config/config.ts` (tipo `ThumderConfig`, versión 1, migración de las claves antiguas, validación de rangos) y `ConfigService`; la velocidad, el guardado y las ventanas se guardan sin recargar el programa.
- [x] **NUC-09. El simulador en un Web Worker** (Media). Hecho: el ensamblador, el simulador y el bucle de ejecución están en `simulator.worker.ts` (`runner.ts`); la página solo dibuja los ciclos. Con retardo 0 se envían hasta 500 ciclos por mensaje (un fotograma), así que ejecutar hasta el final no bloquea la interfaz. Comprobado en Chromium y en Electron (`file://`). Falta un botón «ejecutar hasta el final sin dibujar» que solo muestre el estado final.
- [x] **NUC-10. Elegir los módulos de un programa** (Baja). Hoy se añaden solos los ficheros de la carpeta que declaran con `.global` los símbolos que faltan. Falta una forma explícita de elegirlos, como el diálogo «Load Code or Data» de WinDLX. Hecho: ventana «Módulos» en el editor: automático (como antes) o los ficheros elegidos de la carpeta, por programa.
- [x] **NUC-11. Ventanas de WinDLX que faltan** (Media): la de símbolos (`Memory → Symbols`), los puntos de ruptura por etapa (ID, EX, MEM, WB, lectura y escritura) y el historial del diagrama de ciclos con longitud configurable. Hecho: ventana de símbolos (con filtro), puntos de ruptura por etapa (IF, ID, EX, MEM, WB), vigilancia de lecturas y escrituras de memoria, e historial del diagrama configurable (100 a 100.000 ciclos).

## 4. Datos, cuentas y ficheros

- [x] **DAT-01. Modo invitado por defecto** (Alta). Ahora todas las rutas del simulador exigen sesión. El simulador debería abrirse sin cuenta, guardando los ficheros en el navegador, y la cuenta (Google, GitHub o correo) solo debería servir para sincronizar. En parte: sin claves de Firebase, THUMDER entra como invitado y no se rompe al arrancar (antes se quedaba en blanco con `auth/invalid-api-key`); con Firebase sigue pidiendo sesión. Hecho (fase E de TODO-cierre.md): también con Firebase configurado se entra como invitado; la cuenta solo sirve para sincronizar.
- [x] **DAT-02. Almacenamiento local con sincronización opcional** (Alta). Los ficheros solo están en Firestore, así que sin conexión no hay ficheros, y `getItems` consulta Firestore en cada navegación. Hay que crear una interfaz `FileStore` con una implementación en IndexedDB y otra en Firestore, y activar la caché sin conexión de Firestore. En parte: en modo local los ficheros se guardan en `localStorage` (clave `local_file_items`); falta IndexedDB y la sincronización. Hecho: `FileStore` en IndexedDB siempre y Firestore como segunda copia con sincronización sin duplicados (`mergePlan`).
- [x] **DAT-03. Importar y exportar** (Media). `downloadItem` y `uploadFileChunk` están marcados como TODO. Hay que poder descargar un `.s` o un `.zip` del proyecto, subir varios ficheros y arrastrarlos y soltarlos. Hecho: importar varios `.s`, `.txt` o `.zip` (botón o arrastrar y soltar) y descargar un fichero, la selección o todo en `.zip`.
- [x] **DAT-04. Fechas y tipos coherentes** (Baja). `dateModified` se guarda como `Date`, vuelve como `Timestamp` y en `updateFileItem` pasa por `JSON.stringify`, así que acaba como texto. Hay que normalizarlo a `serverTimestamp()` o a un número. Hecho: `dateModified` es un número (milisegundos); `toMillis` convierte las fechas antiguas (`Date`, `Timestamp`, texto).
- [x] **DAT-05. Nombres y validaciones de ficheros** (Baja). Los ficheros nuevos se llaman `New file - <uuid>.s`. Hay que usar nombres legibles («nuevo.s», «nuevo (2).s») y validar los repetidos y los caracteres no válidos. Hecho: «nuevo.s», «nuevo (2).s»; se rechazan los nombres vacíos, repetidos, reservados o con caracteres no válidos, con el motivo en el formulario.
- [x] **DAT-06. Usuario tipado** (Baja). `JSON.parse(localStorage.getItem("user"))` se repite 9 veces en el servicio de ficheros. Hay que sacar el `uid` de `Auth.currentUser` o de un signal del usuario. Hecho: `AuthService.user` es una *signal* tipada (`InterfaceUser`) y ya no se guarda `user` en `localStorage`.

## 5. Interfaz y experiencia de uso

- [x] **UI-01. Un solo sistema de interfaz** (Alta). Ahora conviven AdminLTE 3 (Bootstrap 4, jQuery y OverlayScrollbars), Angular Material, Covalent, Font Awesome 5, Material Icons y Prism como script global. Hay que elegir uno (Angular Material 20 o Bootstrap 5 sin jQuery) y migrar vista a vista. Ver «Decisiones abiertas». Hecho (fase G de TODO-cierre.md): AdminLTE 3 y Bootstrap 4 (CSS) con el CDK de Angular; fuera Angular Material, Covalent, Material Icons y `ng-table-virtual-scroll` (tabla virtual propia).
- [x] **UI-02. Quitar jQuery y los arreglos de redimensionado** (Media). Las tarjetas dependen de los eventos de AdminLTE (`expanded.lte.cardwidget`…) con `dispatchEvent(new Event("resize"))` y `Utils.wait(500)`. Hay que cambiarlo por componentes Angular y `ResizeObserver` en los lienzos de Pixi. Hecho, por fases en [TODO-jquery.md](TODO-jquery.md):
  - el menú lateral (`SidebarService`), las tarjetas (`thumderCard`), los desplegables, las modales y los acordeones son de Angular;
  - fuera jQuery, Bootstrap JS, AdminLTE JS, OverlayScrollbars, Raphael y `chart.umd.js`;
  - `scripts-*.js` pasa de 1,12 MB a 0,54 MB;
  - los lienzos de Pixi usan `ResizeObserver`.

  Ya no queda ningún `dispatchEvent(new Event("resize"))`:
  - las tablas con desplazamiento virtual se miden solas al cambiar de tamaño (`ViewportResizeDirective`, con `ResizeObserver`);
  - el código lanzaba antes un `resize` global por cada fila que recibía.
- [x] **UI-03. Quitar los restos de plantillas** (Media):
  - el perfil, con datos falsos («Malibu, California», «Jonathan Burke Jr.», 20 `log('TODO')`);
  - la barra de administración, con menús TODO;
  - el buscador de la barra de navegación, que no hace nada;
  - unos 4,5 MB de imágenes sin usar (`team-*.png`, `pattern_angular.png`, `react.jpg`, `vue.jpg`, `admin-lte/img/prod-*.jpg`…).

  El perfil puede ser una página sencilla con la cuenta, la sincronización y la opción de borrar los datos.
- [x] **UI-04. Controles de simulación claros** (Alta): En parte: botones con nombre traducido, estado de la conexión con texto y atajos F5, F10 y Mayús+F5; falta el control de velocidad. Hecho (fase F de TODO-cierre.md): selector de velocidad en la barra (también durante la ejecución), «ejecutar hasta el final sin dibujar» (F8) y «paso atrás» (Mayúsculas+F10).
  - una sola barra (ahora los controles están duplicados en [auth-navbar.component.html:84](src/app/components/navbars/auth-navbar/auth-navbar.component.html#L84) y en la línea 137);
  - botones con texto traducido (ahora tienen títulos en inglés fijos, como «Reset connection» o «Play / Pause»);
  - atajos de teclado (F5 para ejecutar o pausar, F10 para un paso, Mayúsculas+F5 para terminar, Ctrl+R para reiniciar);
  - un control de velocidad;
  - el estado de la conexión con texto, no solo con un color lima o naranja.
- [x] **UI-05. La vista múltiple guarda su distribución** (Media). Hay que guardar el orden y las tarjetas visibles al arrastrar y unificar `multiview` con `grid-view` (beta), quedándose con una. En parte: la vista múltiple guarda el orden al arrastrar; falta unificarla con `grid-view`. Hecho: fuera `grid-view` y `angular-gridster2`; queda la vista múltiple.
- [x] **UI-06. Un panel de problemas** (Media). Los errores del ensamblador ya salen como marcas en Monaco. Falta una lista con la línea, el mensaje y un clic que lleve a la línea, y un aviso de «no se puede simular» que explique por qué (ahora `canSimulate` queda en `false` sin explicación). Hecho: panel de problemas bajo el editor, con cada error y su línea (un clic lleva a ella) y el motivo de que no se pueda simular.
- [x] **UI-07. Tema oscuro** (Media). No hay ninguno. Hay que respetar `prefers-color-scheme`, ofrecer un selector y aplicar el tema a Monaco, xterm, Pixi y los gráficos. Hecho: tema claro, oscuro o el del sistema en la barra; Monaco tiene su tema oscuro de DLX y los lienzos cambian de fondo.
- [x] **UI-08. Pantallas pequeñas y portátiles** (Media, verificar). Los lienzos se dimensionan con `window:resize`. Hay que probar a 1366×768 y en tableta, y que el pipeline y el diagrama permitan zoom y desplazamiento con el ratón, el tacto y el teclado. Hecho, comprobado en móvil (390×844 y 844×390), tableta (820×1180), portátil (1024×768) y escritorio (1440×900), sin desbordamiento horizontal en ninguna ruta:
  - **Menú lateral:** se inicia desde el layout (antes, al abrir directamente una ruta en una tableta, tapaba el contenido) y se cierra al navegar donde se superpone (`SidebarService`).
  - **Barra superior:** los enlaces de texto solo desde 1200 px; en el móvil, iconos para el estado del simulador y el idioma.
  - **Tablas de código, registros y memoria:** con una *container query*, en tarjetas estrechas cada columna toma el ancho de su contenido y la tabla se desplaza de lado dentro de la tarjeta.
  - **Pipeline:** se escala al ancho de la tarjeta (mínimo 0,55; en el móvil se desplaza de lado). El lienzo crecía 7 px en cada cambio de tamaño.
  - **Diagrama de ciclos:** ocupa el ancho de la tarjeta, se dibuja al 70 % en tarjetas estrechas y se arrastra con el dedo o el ratón. Los dos lienzos se adaptan con un `ResizeObserver` y son nítidos en pantallas de alta densidad.
  - **Editor:** el minimapa y el plegado se ocultan en editores estrechos, y la altura se ajusta a la pantalla.
  - **Vistas:** el gestor de ficheros oculta la fecha en el móvil y abre carpetas desde su menú (sin doble toque); «Sobre nosotros», la calculadora y la multivista se apilan.
  - **Pantallas pequeñas y táctiles:** en pantallas bajas el pie no es fijo, y los botones son más grandes en pantallas táctiles.

  - **Zoom:** el pipeline y el diagrama de ciclos se amplían con los botones de su tarjeta y con Ctrl + rueda (también el pellizco de un panel táctil). El diagrama, además, con el pellizco de dos dedos y con las teclas `+`, `-` y `0`.
- [x] **UI-09. Las flechas del teclado no se capturan en todo el documento** (Media). El diagrama de ciclos escucha `document:keydown` para desplazarse, y en la vista múltiple eso puede interferir con el editor y las tablas. Solo debería escuchar cuando el lienzo tiene el foco. [pixi-cycle-clock-diagram.component.ts:131](src/app/components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component.ts#L131) Hecho (fase D): el lienzo del diagrama recibe el foco y solo entonces atiende el teclado.
- [x] **UI-10. Avisos útiles** (Baja). Hay que unificar `DEFAULT_CONFIG_TOAST`, dar una duración legible, no avisar en cada reinicio, y mostrar el progreso de la simulación (paso, ciclos, instrucción actual) en la barra de estado en lugar de con avisos. Hecho: avisos con la misma configuración (`TOAST`) y duración legible, sin aviso en cada carga; barra de estado en el pie con el estado, el ciclo, la línea y la instrucción.
- [x] **UI-11. Configuración comprensible** (Baja). Hay que explicar cada opción (adelantamiento, unidades y retardos de coma flotante, tamaño de memoria), confirmar antes de reiniciar la máquina y deshabilitar la URL del servidor cuando se use el motor local. Hecho: la configuración tiene secciones y una explicación en cada opción, ajusta los valores a sus límites y pide confirmación antes de reiniciar una simulación en marcha. La URL del servidor ya no existe.

## 6. Accesibilidad

- [x] **A11Y-01. Alternativa a los lienzos** (Alta). El pipeline y el diagrama de ciclos solo existen en un `<canvas>`. El diagrama de ciclos es una tabla, así que se puede ofrecer una vista en `<table>` (instrucción por ciclo) y una descripción textual del pipeline, más una región `aria-live` que anuncie el paso y la línea. Hecho: el diagrama se ve también como tabla (los últimos 30 ciclos) y el pipeline se describe en texto; la barra de estado se anuncia al parar.
- [x] **A11Y-02. Elementos interactivos de verdad** (Alta). Hay 51 `(click)` en `<a>` sin `href`, `<span>`, `<i>` o `<div>`, entre ellos los controles de simulación, el idioma y cerrar sesión. Deben ser `<button>` o enlaces con `routerLink`. En parte: la barra de navegación ya usa botones y enlaces. Hecho: los títulos de las tarjetas son botones (rol, foco y Enter), los inicios de sesión con Google y GitHub son botones y los enlaces tienen `href`.
- [x] **A11Y-03. Botones de icono con nombre** (Media). Los botones de las tarjetas (refrescar, maximizar y plegar) y el asa de arrastre no tienen nombre accesible, y los `title` son identificadores en inglés (`AUTH-CONFIG`, `HomePage`). Hay que darles `aria-label` traducidos. En parte: los botones de la barra de navegación tienen nombre traducido. Hecho: los botones de icono tienen nombre traducido (la directiva de las tarjetas lo pone y lo cambia con el estado).
- [x] **A11Y-04. No depender solo del color** (Media). Las etapas del pipeline y los atascos (R-Stall, T-Stall, W-Stall, S-Stall) se distinguen por el color. Hay que añadir el texto o un patrón y comprobar el contraste. Hecho: los atascos y las etapas también se dicen con texto (tabla, descripción, explicación); contraste de 4,5:1 en los dos temas; axe sin reglas pendientes.
- [x] **A11Y-05. Pruebas automáticas** (Media). Hay que pasar axe en las pruebas e2e de cada vista y gestionar el foco al abrir y cerrar los modales de editar registro o memoria. Hecho: axe (WCAG 2.1 A y AA) en 15 vistas (`e2e/a11y.spec.ts`), y el foco de las modales (`ModalService`). Las reglas que aún fallan están en `PENDING`, cada una con su causa, y se cierran en A11Y-01 a A11Y-04.

## 7. Idiomas

- [x] **I18N-01. El código de idioma es `sp`, no `es`** (Media). `sp.json` y `DEFAULT_LANG = "sp"` acaban en `<html lang="sp">`, que no es un código válido ([app.component.ts:123](src/app/app.component.ts#L123)). Hay que renombrarlo a `es` y migrar el valor guardado.
- [x] **I18N-02. Claves desalineadas** (Baja). `ACCOUNT.YOU_FORGOT_YOUR_PASSWORD?_…` está escrita de dos maneras y `MACHINE.UINT8ARRAY` falta en español. Hay que añadir una comprobación en la integración continua que compare las claves.
- [x] **I18N-03. Textos fijos en las plantillas** (Media). Hay textos sin traducir en `file-manager` (22), `debug` (15), `calculator` (12), `memory` (9), los modales de edición, el menú lateral, la barra de navegación y el pie, además de los mensajes de `AuthService`. Hecho: textos de las plantillas traducidos (404, menú, pie, modales de edición, calculadora, formularios de la cuenta, tipos de datos).
- [x] **I18N-04. Documentación por idioma** (Baja). `docs.md`, `dlxmap.md` y la wiki están en un solo idioma. Hay que decidir si se traducen o si se avisa del idioma. Hecho: la documentación se queda en su idioma (la wiki en español, el juego de instrucciones en inglés); los títulos se traducen y cada documento avisa de su idioma y lo declara (`lang`).

## 8. Rendimiento

- [x] **REN-01. Optimizar la compilación de producción** (Alta). Las tres configuraciones tienen `"optimization": false` y presupuestos de 80/100 MB ([angular.json:136](angular.json#L136)). Hay que activar la optimización en `production` y `web` y bajar los presupuestos a valores reales. Hecho: 9,1 MB iniciales (1,7 MB transferidos) frente a 18,5 MB.
- [x] **REN-02. Cargar bajo demanda lo pesado** (Media). Monaco (con todos sus lenguajes, más de 90 trozos), Pixi, xterm, Chart.js y Firebase entran en el paquete inicial o como scripts globales. Hay que cargar Monaco solo con el lenguaje DLX, y Pixi y Chart.js solo en sus vistas. También hay que quitar Prism, emoji-toolkit y raphael de `scripts` si no se usan, porque ni siquiera están en `package.json` y solo funcionan gracias a `shamefully-hoist`. Hecho: Monaco sin lenguajes y solo en el editor, PixiJS en sus vistas, cada vista del simulador bajo demanda, fuera emoji-toolkit (Prism queda, ahora como dependencia declarada); paquete inicial de 1,43 MB a 536 KB transferidos.
- [x] **REN-03. La tabla de código es cuadrática** (Media). `setRow` llama a `refresh()`, que copia el array entero en cada fila (8.192 filas con 32 KB de memoria), y `checkIfContains` filtra por fila en cada detección de cambios. Hay que actualizar en bloque, usar un `Map` de dirección a etapa y `OnPush`. [code.view.ts:134](src/app/views/_auth/code/code.view.ts#L134) Hecho: las filas se crean en bloque al cargar un programa y la etapa sale de un `Map` de dirección a etapa; `OnPush`.
- [x] **REN-04. Objetos de Pixi sin liberar** (Media). Se hace `removeChild` sin `destroy()` en flechas y celdas, se crea un `PIXI.Text` por celda y el diagrama crece sin límite en programas largos. Hay que reutilizar objetos, usar `BitmapText` y pintar solo la zona visible. [PixiTHUMDER_CycleClockDiagram.ts:123](src/app/__core/machine/PixiTHUMDER_CycleClockDiagram.ts#L123) Hecho: el diagrama pinta solo las filas y los ciclos visibles con un `Graphics` y un grupo de `BitmapText` que se reutilizan, y se destruye con sus hijos.
- [x] **REN-05. Detección de cambios** (Baja). No hay `OnPush` ni signals. Pasar las vistas de la máquina a signals reduce el trabajo en cada paso. Hecho: `OnPush` en código, registros, memoria, estadísticas y consola, que leen las *signals* de `MachineService.state`.
- [x] **REN-06. Las GIF de la wiki pesan 116 MB** (Alta, encontrado al arreglar). `angular.json` copia `wiki/wiki-assets/*.gif` en la aplicación, así que van en el instalador y en Netlify (la mayor, `8_TheConfiguration-ExampleWithExecution.gif`, ocupa 60 MB). Hay que pasarlas a vídeo (MP4 o WebM) en la wiki o cargarlas desde GitHub en lugar de empaquetarlas. Además, `src/assets/img` (7,1 MB, 59 imágenes de plantillas) ya está borrada (UI-03). Hecho: las GIF no se copian; la documentación de la aplicación las carga de la wiki en GitHub.

## 9. Pruebas

- [x] **TEST-01. Arreglar las pruebas unitarias** (Alta). `tsconfig.spec.json` usa `module: commonjs` con `verbatimModuleSyntax` heredado. Hay que pasar a `@angular/build:unit-test` con Vitest (o a Karma con Chrome sin ventana en vez de `karma-electron`) y quitar jasmine 3.6, `@types/jasminewd2` y `webdriver-manager`.
- [x] **TEST-02. Pruebas del núcleo** (Alta). Hoy hay 6 ficheros `.spec` y casi todos son plantillas. Lo prioritario: En parte: 57 pruebas (memoria, registros, conversiones, estadísticas, máquina con socket falso, ficheros, traducciones). Hecho (fase A de TODO-cierre.md): pruebas de `ManagerBreakpoints` y de `stringFormat`. Con las del motor (`engine/*.spec.ts`), las directivas y los servicios suman 264 pruebas unitarias. Las conversiones de NUC-06 llevan sus propias pruebas.
  - `ManagerMemory` (byte, media palabra, palabra, `float`, `double`, límites);
  - `ManagerRegisters` (`Control`, `Integer`, `Float`, `Double`);
  - las conversiones de NUC-06;
  - `ManagerBreakpoints`;
  - `stringFormat`;
  - el encadenamiento de pasos con un socket simulado.
- [x] **TEST-03. Pruebas e2e nuevas** (Media). Hay que sustituir Spectron y Cypress 9 por Playwright (que también controla Electron). Las pruebas mínimas: Hecho: Playwright en `e2e/` (47 pruebas en escritorio, móvil y tableta) y `e2e/electron/` (la aplicación de escritorio), en CI. Cubren las mínimas de esta lista y además la interfaz adaptable, el zoom, la consola y los ejemplos. Fuera Spectron y Cypress.
  - abrir un ejemplo, ensamblar y ver los errores;
  - simular paso a paso y comprobar los registros;
  - un punto de ruptura;
  - el diagrama con unidades de coma flotante;
  - cambiar de idioma;
  - axe en cada vista.

  Las de Cypress usan una cookie `user` que ya no es el mecanismo de la sesión.
- [x] **TEST-04. Programas de referencia** (Media). Para `fact.s`, `gcm.s`, `prim.s` y `win-dlx.s` hay que guardar el estado final esperado (registros, memoria, ciclos y atascos, con y sin adelantamiento) y compararlo en cada cambio del motor. Hecho: `pipeline.spec.ts` ejecuta todos los ejemplos con cuatro configuraciones y exige el mismo estado final (registros, memoria, instrucciones) que el ejecutor de referencia, además de las líneas temporales de las reglas de WinDLX.

## 10. Compilación, dependencias y herramientas

- [x] **BLD-01. Guardar el lockfile** (Alta). `pnpm-lock.yaml` está en `.gitignore`, así que cada instalación resuelve versiones distintas (Electron salió en la 44). Hay que guardarlo y usar `pnpm install --frozen-lockfile` en la integración continua. Hecho: `pnpm-lock.yaml` ya no se ignora (hay que añadirlo al repo) y Electron está fijado a 44.7.2.
- [x] **BLD-02. Plantillas de entorno** (Media). Faltan `environment.*.ts` (con razón, porque están en `.gitignore`), pero no hay ningún ejemplo. Hay que añadir `environment.example.ts` y un script que lo copie, o leer la configuración de Firebase en tiempo de ejecución.
- [x] **BLD-03. Dependencias desfasadas o incoherentes** (Media): En parte (fase C): ngx-translate 17, ngx-markdown 20 con marked 16, `@types/node` 22 y firebase-tools 15; fuera ng2-charts, chart.js, `@types/chart.js`, ngx-socket-io, Cypress, ESLint y los restos de Spectron. Hecho en la fase E: `@angular/fire` 20.1 y `firebase` 11.10. Queda electron-builder (fase H). Hecho en la fase H: electron-builder 26 y Angular 20.3.34.
  - `@angular/fire` 7.6 con `firebase` 9.8 (Angular 20 necesita `@angular/fire` 20);
  - `ngx-translate` 14;
  - `ngx-socket-io` 4.1 (pensada para Angular 12);
  - `ng2-charts` 5;
  - `@types/chart.js` 2.9 con `chart.js` 4 (que ya trae sus tipos);
  - `@types/node` 14 con Node 24;
  - `angular-eslint` 21 con Angular 20;
  - `ngx-markdown` 19 con `marked` 18;
  - `cypress` 9 y `firebase-tools` 11.
- [x] **BLD-04. Quitar configuración obsoleta** (Baja): Hecho: fuera `ngcc.config.js`, `angular.webpack.js`, `._eslintrc.json`, ESLint y typescript-eslint (solo Biome), `@angular-devkit/build-angular`, `polyfills.ts` y la línea repetida de `.npmrc`.
  - `ngcc.config.js` (ngcc desapareció en Angular 16);
  - `angular.webpack.js` (el builder es esbuild);
  - `@angular-devkit/build-angular` si ya solo se usa `@angular/build`;
  - `polyfills.ts` si solo importa zone.js;
  - `._eslintrc.json` con ESLint y typescript-eslint instalados junto a Biome (hay que quedarse con uno);
  - `"node-linker=hoisted"` repetido en `.npmrc`.
- [x] **BLD-05. Lint en verde** (Media). Hay que corregir los 2 errores de Biome (orden de imports), tipar los 82 `any`, quitar los 25 constructores vacíos y los 40 constructores `constructor(...args: unknown[])` que dejó la migración a `inject()`, y activar el lint de plantillas. Hecho: 0 errores, avisos de 100 a 75 y fuera los 39 constructores de la migración a `inject()`.
- [x] **BLD-06. `.browserslistrc` alineado con Angular** (Baja). La lista incluye navegadores fuera del soporte de Angular 20 (el aviso de Opera aparece en `build-errors.txt`). Hecho: fuera `.browserslistrc`; Angular 20 usa su lista.
- [x] **BLD-07. Componentes independientes** (Media). Hay que migrar los 69 componentes, *pipes* y directivas a `standalone` (con el *schematic* oficial), eliminar `SharedModule`, `ComponentsModule` y `CoreModule`, y valorar quitar zone.js más adelante. Hecho (fase C de TODO-cierre.md): todo `standalone`, sin ningún NgModule, con `bootstrapApplication`, `app.config.ts` y rutas en `*.routes.ts`. Quitar zone.js queda para más adelante.

## 11. Integración continua y publicación

- [x] **CI-01. Integración continua en cada push y PR** (Alta). Hoy solo hay `create-release.yaml`, que se lanza con las etiquetas. Hay que añadir un flujo con `pnpm install --frozen-lockfile`, lint, compilación y pruebas unitarias, y otro de e2e. Hecho; falta verlo pasar en GitHub.
- [x] **CI-02. Arreglar el flujo de publicación** (Alta). Ahora: Hecho (pnpm, Node 22, `dist/browser`); el despliegue en Netlify pasa a `deploy-netlify.yaml` (con `--no-build`: el CLI actual compila por defecto). Falta probarlo con una etiqueta.
  - usa Node 12 y 14 (el proyecto pide 18.19 o superior);
  - usa `npm install` en un proyecto pnpm;
  - llama a `ng:build-angular:production`, que ya no existe;
  - despliega `dist-angular`, que ya no se genera (la salida es `dist/browser`);
  - usa `::set-output`, que está obsoleto, y `actions/*@v1/v2`;
  - el secreto se llama `ANGULAR_ENVIROTMENT_PRODUCTION` (con errata).
- [x] **CI-03. Publicación por plataforma** (Media). Hay que firmar los binarios de Windows y macOS (o avisar de que no lo están), recuperar macOS, generar `latest.yml` para las actualizaciones automáticas con `electron-updater` y adjuntar las notas del CHANGELOG. Hecho: macOS recuperado, `latest*.yml` publicados y notas del CHANGELOG en un borrador de release. Sin certificados, los binarios siguen sin firmar y las notas lo avisan.
- [x] **CI-04. Despliegue de vista previa** (Baja). Desplegar en Netlify una vista previa por PR. Hecho: `deploy-netlify.yaml` despliega una vista previa por PR (`pr-<número>`) y otra de `dev`, y la producción con las etiquetas `v*` o a mano, sin depender de que se compilen los ejecutables. Falta verlo pasar en GitHub con los secretos.

## 12. Documentación y limpieza del repositorio

- [x] **DOC-01. README al día** (Media). Los comandos `ng:serve-angular:dev` y `ng:build-angular:production` ya no existen. Falta explicar cómo crear `environment.dev.ts`, cómo clonar y arrancar THUMDER-server y la memoria que necesita Node. Las `keywords` dicen «angular 12» y «spectron».
- [x] **DOC-02. Ficheros que sobran en el repo** (Baja): `build-errors.txt` (unos 600 KB de un registro de Windows en UTF-16), `generate-uml.cmd` (solo Windows), `firebase.json` vacío y los diagramas de `UML/` si ya no corresponden al código. En parte: borrado `build-errors.txt`. Hecho (fase I de TODO-cierre.md): fuera `generate-uml.cmd`; `firebase.json` y `firestore.rules` ya se usan (SEG-04); `UML/` se conserva como diseño original de 2022, con un README que explica en qué ha cambiado el código.
- [x] **DOC-03. Documentación del protocolo** (Media). Hay que documentar los eventos del socket (`SimulationInitRequest`, `SimulationNextStepRequest`, `Update*Request`…) con sus tipos, idealmente generados desde `thumder-ontology`. Hecho: el protocolo es ahora el del Worker (`runner.ts`): mensajes, peticiones y respuestas, en `docs/simulador.md`, «El protocolo del Worker».
- [x] **DOC-04. Guía de contribución** (Baja): estructura de carpetas, convenciones, cómo ejecutar las pruebas y cómo publicar. Hecho: `CONTRIBUTING.md` (estructura, convenciones, pruebas y publicación).

## 13. Valor didáctico (funcionalidades nuevas)

- [x] **EDU-01. Explicar los atascos** (Alta). Al pasar el ratón o al hacer clic en un atasco del diagrama, explicar por qué ocurre: qué registro, qué instrucción lo produce y si el adelantamiento lo habría evitado. Hecho: el motor da el motivo de cada atasco (`StallReason`): tipo, registro, instrucción que lo causa y si el adelantamiento lo habría evitado; el diagrama lo explica al elegir una celda.
- [x] **EDU-02. Comparar con y sin adelantamiento** (Alta). Ejecutar el mismo programa con las dos configuraciones y enseñar las diferencias de ciclos, CPI y atascos lado a lado. Hecho: botón en Estadísticas que ejecuta el programa con y sin adelantamiento (en el Worker) y enseña ciclos, CPI y atascos lado a lado.
- [x] **EDU-03. Paso atrás** (Media). Guardar instantáneas por ciclo (más fácil con NUC-02 y NUC-03) para poder retroceder y volver a ver un riesgo. Hecho: paso atrás repitiendo la ejecución hasta el ciclo anterior con un diario de los cambios de la persona; deja el mismo estado (probado con entrada y registros cambiados a mano).
- [x] **EDU-04. Ejemplos guiados** (Media). Una galería de ejemplos por tema (riesgos de datos, de control y estructurales, coma flotante, bucles, memoria) con un enunciado y preguntas («¿cuántos ciclos tarda?») que se comprueban al terminar. En parte: hay 20 ejemplos clásicos comentados (`docs/ejemplos-dlx.md`), de bucles y memoria a coma flotante y un catálogo de riesgos, cada uno con «qué mirar» y una prueba que hacer, y verificados por `classics.spec.ts`. Faltan el enunciado con preguntas que se comprueben y elegirlos desde una galería en vez de copiarlos al gestor de ficheros. Hecho: galería de 8 ejercicios por tema (`src/assets/exercises/exercises.json`), con su configuración bloqueada y preguntas que se comprueban con el resultado de la simulación.
- [x] **EDU-05. Ver la ruta de datos** (Media). `Datapath_Schematic.svg` ya existe. Se puede resaltar en él qué se activa en cada etapa del ciclo actual. Hecho: vista «Ruta de datos» con un esquema propio del pipeline de THUMDER (la SVG existente es de otro procesador): cada etapa con su instrucción, los atascos y el adelantamiento usado en el ciclo.
- [x] **EDU-06. Exportar resultados** (Baja). El diagrama como PNG o SVG y CSV, y las estadísticas como CSV, para memorias de prácticas. Hecho: el diagrama en SVG y CSV (todo el historial) y PNG (lo visible), y las estadísticas en CSV.
- [x] **EDU-07. Modo docente** (Baja). Compartir un ejercicio por enlace (programa más configuración) y bloquear opciones (por ejemplo, el adelantamiento) en ese ejercicio. Hecho: «Compartir» en el editor crea un enlace con el programa, la configuración, un enunciado y las opciones bloqueadas (comprimido, sin servidor); al abrirlo se copia en «compartidos» y la configuración bloqueada no se puede cambiar.

## 14. THUMDER-server

Encontrado al probar THUMDER contra el servidor (commit `1cec1e1`, motor de pipeline nuevo). Son del otro repositorio y **ya no afectan con el simulador local** (la opción por defecto), que resuelve todos estos puntos; solo importan si se elige THUMDER-server en la configuración. Lo más sencillo sería que THUMDER-server usara el motor de THUMDER (`src/app/__core/engine/`, TypeScript sin Angular).

- [x] **SRV-01. El pipeline no gestiona los riesgos de datos** (Alta). No hay detenciones ni adelantamiento. Con `prim.s`, `srli r10,r1,2` lee R1 antes de que `addi` lo escriba (da 0 en vez de 1) y `sge r11,r10,r9` lee R9 antes de que lo cargue `lw` (da 1). El programa termina en el ciclo 19 sin calcular ningún primo. Solo aparecen detenciones de control. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-02. La línea de cada paso siempre es 0** (Alta). «Source line is not tracked by the current interpreter», así que los puntos de ruptura por línea nunca saltan y el editor no marca la línea que se ejecuta. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-03. `prim.s` devuelve errores inventados** (Media). `SimulationInit` responde siempre «Error X» y «Error Y» (y una directiva de ejemplo) para ese fichero. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-04. No se simulan las unidades de coma flotante** (Alta). `faddEX`, `fmultEX` y `fdivEX` llegan siempre vacías y los registros F nunca cambian. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-05. La configuración no llega al pipeline** (Alta). `SimulationInit` crea una máquina nueva con un pipeline que guarda el objeto de configuración del momento; `UpdateConfigurationMachine` llega después y sustituye el objeto, pero el pipeline sigue con el viejo. Así, el adelantamiento y las unidades de coma flotante elegidas no se aplican. Lo más sencillo es mandar la configuración dentro de `SimulationInitRequest`. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-06. Los datos de las directivas no se envían** (Media). La memoria que llenan `.word`, `.double`… solo existe en el servidor, así que el cliente muestra ceros en el segmento de datos. No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.
- [x] **SRV-07. Las mismas conversiones con pérdida de precisión** (Media). `Utils.hexadecimalToBinary` del servidor también usa `parseInt` con valores de 64 bits (como BUG-03 en el cliente), y `getRegisterNumber` falla si el registro llega como número (BUG-23). No aplica (16 de octubre de 2026): el cliente ya no usa THUMDER-server, solo su simulador en el Worker, que no tiene este fallo.

---

## Plan por fases

Cada fase deja el proyecto funcionando y publicable. Las fases 0 a 2 son urgentes porque afectan a la corrección y a la seguridad. Desde la 3 dependen de las decisiones abiertas. El tamaño es orientativo: **S** (días), **M** (1 a 2 semanas), **L** (más de 2 semanas).

### Fase 0. Base de trabajo (S)

**Objetivo**: poder cambiar código con confianza. Que todo compile, se pruebe y se publique desde cero.

- BLD-01 (lockfile), BLD-02 (plantilla de entorno), TEST-01 (pruebas unitarias que compilen), CI-01 (integración continua en cada PR), BLD-05 (los 2 errores de Biome), DOC-01 (README), DOC-02 (limpieza).

**Terminado cuando**: un clon nuevo se instala, compila y pasa lint y pruebas con los comandos del README, y cada PR ejecuta lint, compilación y pruebas.

### Fase 1. Corrección del núcleo (M)

**Objetivo**: que todo valor que enseña THUMDER sea correcto y que la simulación sea determinista.

- NUC-06 (conversiones en un módulo probado), BUG-02, BUG-03 y BUG-04 (`float`, `double` y memoria), BUG-15, BUG-01, BUG-07, BUG-14.
- BUG-05 y BUG-19 con NUC-01 (protocolo con promesas, sin pasos solapados).
- BUG-06 (manejadores del socket al cambiar de URL).
- TEST-02 (pruebas del núcleo) y TEST-04 (programas de referencia).
- BUG-16 (verificar con el servidor).

**Terminado cuando**: las pruebas de valores conocidos y los programas de referencia pasan, y ejecutar de seguido un programa con un servidor lento da el mismo resultado que hacerlo paso a paso.

### Fase 2. Seguridad y Electron (M)

**Objetivo**: un Electron empaquetado que funcione y no exponga Node a la página.

- SEG-01 (`preload` y `contextBridge`), SEG-02 (Markdown saneado), SEG-03 (navegación y CSP), BUG-12 (rutas de `dist/browser`), SEG-06 (versiones fijadas).
- SEG-04 (reglas de Firestore con pruebas), SEG-05 (solo Auth y Firestore, y Analytics con consentimiento).
- CI-02 (flujo de publicación arreglado).

**Terminado cuando**: la publicación de una etiqueta genera AppImage y `.exe` que arrancan, `window.require` no existe en la página y las reglas de Firestore tienen pruebas.

### Fase 3. Arquitectura de la simulación (L)

**Objetivo**: un estado de máquina único, independiente de las vistas y, si se decide, un motor local.

- NUC-02 (estado único) y NUC-04 (modelo separado de Pixi), que arreglan BUG-09 y BUG-08.
- BUG-10 (unidades de coma flotante en el diagrama).
- NUC-03 (motor en un Web Worker), si se aprueba.
- NUC-05 (código muerto), NUC-07 (registro con niveles), NUC-08 (configuración validada), BUG-17, BUG-18.
- DOC-03 (protocolo documentado).

**Terminado cuando**: se puede simular desde cualquier vista y al abrir el diagrama aparece completo. Con el motor local, la versión web simula sin servidor y sin conexión, y las pruebas e2e no necesitan servidor.

### Fase 4. Datos y cuentas (M)

**Objetivo**: usar THUMDER sin cuenta y no perder trabajo nunca.

- DAT-01 (modo invitado), DAT-02 (IndexedDB más sincronización opcional), BUG-11 (cerrar sesión no borra la configuración), BUG-13 (carpetas), DAT-03 (importar y exportar), DAT-04, DAT-05, DAT-06.

**Terminado cuando**: alguien sin cuenta puede abrir, editar, guardar, simular y descargar sus programas. Al iniciar sesión, se sincronizan sin duplicados.

### Fase 5. Interfaz (L)

**Objetivo**: una interfaz coherente, sin jQuery ni restos de plantillas, y cómoda para practicar.

- UI-01 (un solo sistema), UI-02 (sin jQuery), UI-03 (restos de plantillas fuera), UI-04 (controles de simulación y atajos), UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11.
- BLD-07 (componentes independientes) a la vez que se toca cada vista.

**Terminado cuando**: no queda jQuery ni AdminLTE, todas las vistas funcionan a 1366×768 y en tema oscuro, y la simulación se controla entera desde el teclado.

### Fase 6. Accesibilidad, idiomas y rendimiento (M)

**Objetivo**: que lo use cualquiera, en su idioma y en equipos modestos.

- A11Y-01 a A11Y-05.
- I18N-01 a I18N-04.
- REN-01 a REN-05.
- TEST-03 (Playwright con axe).

**Terminado cuando**: axe no da errores en ninguna vista, no quedan textos sin traducir (lo comprueba la integración continua), el paquete inicial baja de forma medible (objetivo: menos de 3 MB comprimidos) y un programa de 1.000 ciclos se simula sin tirones.

### Fase 7. Didáctica (L, continua)

**Objetivo**: que THUMDER no solo enseñe qué pasa, sino por qué.

- Orden sugerido: EDU-01 (explicar los atascos), EDU-02 (con y sin adelantamiento), EDU-03 (paso atrás), EDU-04 (ejemplos guiados), EDU-05 (ruta de datos), EDU-06 (exportar), EDU-07 (modo docente).
- CI-03 y CI-04 (publicación por plataforma y vistas previas).

**Terminado cuando**: cada funcionalidad tiene un ejemplo guiado que la usa y una prueba e2e.

---

## Decisiones abiertas

1. **¿Motor local o servidor?** (afecta a las fases 3 y 4). Ejecutar el núcleo de THUMDER-server en un Web Worker elimina el servidor, permite trabajar sin conexión y simplifica Electron. Lo que cuesta: extraer el núcleo del servidor a una librería compartida. Recomendación: hacerlo, y mantener el modo servidor como opción.
2. **¿Qué sistema de interfaz?** (afecta a la fase 5). Angular Material 20 ya está instalado y encaja con Angular. Bootstrap 5 se parecería más a lo actual. Recomendación: Angular Material, con el tema propio de THUMDER.
3. **¿Seguir con Firebase?** (afecta a las fases 2 y 4). Si el modo invitado con IndexedDB cubre lo esencial, Firebase queda solo para sincronizar. Otra opción es quitarlo del todo y exportar e importar ficheros.
4. **¿Electron o PWA?** Con el motor local, una PWA instalable cubre casi todo lo de Electron (ficheros con la File System Access API). Electron solo se justificaría para un uso totalmente sin conexión con acceso a disco, o si los centros lo exigen.
