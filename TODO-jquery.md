# Quitar jQuery de THUMDER

Plan por fases para la tarea UI-02 de [TODO-mejoras.md](TODO-mejoras.md). Cada fase deja la aplicación funcionando y se comprueba antes de pasar a la siguiente.

## Objetivos

- [x] Ningún uso de `window.jQuery` ni de `$` en el código (`src/app`, `src/assets`).
- [x] Fuera de `angular.json` los scripts que dependen de jQuery: `jquery`, `bootstrap.bundle`, `jquery.overlayScrollbars`, `adminlte.js` y `jquery.mousewheel`. También `raphael` y `chart.umd.js`, que nadie usa, e `initMainPage.js`.
- [x] Todo lo que hoy hace el JavaScript de AdminLTE y de Bootstrap lo hace Angular: el menú lateral, las tarjetas, los desplegables, las ventanas modales y los acordeones.
- [x] Se conserva el aspecto: el CSS de AdminLTE (que incluye el de Bootstrap 4) se queda. Cambiar de sistema de interfaz es otra tarea (UI-01).
- [x] Todo funciona igual en la web y en Electron (`file://`), en móvil, tableta y escritorio.
- [x] Lint sin errores, pruebas unitarias en verde y compilaciones de desarrollo y producción.

## Por qué hay que hacerlo por partes

Los scripts globales se juntan en un único `scripts-*.js`. Sin jQuery, Bootstrap 4.6.2 lanza un error al cargar y el resto del fichero no se ejecuta: ni AdminLTE, ni Prism, ni JoyPixels, ni cookieconsent, ni `initMainPage.js`. Por eso jQuery solo se puede quitar al final, cuando ya nada lo necesite.

## Inventario de partida

| Qué | Dónde | Cuántos |
| :-- | :-- | :-- |
| Botones de tarjeta (`data-card-widget`) | 13 plantillas | 30 `collapse`, 18 `maximize`, 1 `remove` |
| Eventos de las tarjetas (`*.lte.cardwidget`) | `code`, `memory`, `registers`, `editor`, `multiples-views`, `app.component` | 14 escuchas |
| Tarjetas plegadas desde el código (`CardWidget("collapse")`) | `registers`, `multiples-views` | 2 |
| Ventanas modales (`data-toggle="modal"`, `data-dismiss`) | `registers`, `memory`, `footer`, `modal`, `modal-bottom`, `edit-register-binary32`, `edit-memory-binary32` | 7 aperturas, 6 cierres |
| Acordeones (`data-toggle="collapse"`) | `about`, `docs-item` | 7 |
| Desplegables (`data-toggle="dropdown"`) | `auth-navbar` (2), `login`, `register`, `forgot-password` | 5 |
| Menú lateral (`PushMenu`) | `auth-navbar`, `SidebarService`, `layout-landing`, `initMainPage.js` | 1 botón, 3 llamadas |
| Submenús (`Treeview`) | `aside-left`, `layout-auth`, `index.view`, `initMainPage.js` | el menú no tiene submenús |
| Alturas del layout (`Layout()`) | `app.component`, `initMainPage.js` | 2 llamadas |
| Animación de desplazamiento | `windows/debug` | 1 |
| Tipos `jQuery: any` y `$: any` | `Types.ts`, `typings.d.ts` | 2 |

---

## Fase 0. Red de seguridad

**Objetivo**: saber qué hace hoy cada pieza para comprobar que sigue haciéndolo.

- [x] Script de comprobación con Playwright (en el *scratchpad*, no en el repositorio):
  - abre y cierra el menú lateral en móvil y escritorio;
  - pliega y maximiza tarjetas;
  - abre los desplegables, las ventanas de editar registro y memoria, y los acordeones de «Sobre nosotros»;
  - comprueba el aviso de cookies y el resaltado de código de la documentación;
  - busca errores de página.
- [x] Capturas de referencia en móvil, tableta y escritorio (la auditoría de la interfaz adaptable).
- [x] Medir el tamaño de `scripts-*.js` en la compilación de producción.

**Resultado** (15 de octubre de 2026):

- Pasan las 16 comprobaciones, sin errores de página.
- `scripts-*.js` mide 1.119.430 bytes.
- Un fallo previo, que no viene de jQuery: los bloques `bash` del Markdown no se resaltan, porque solo se cargan los lenguajes de Prism TypeScript, JavaScript y CSS.

## Fase 1. Menú lateral y layout

**Objetivo**: el menú lateral lo gobierna Angular, sin `PushMenu`, `Treeview` ni `Layout()`.

- [x] `SidebarService` guarda el estado (abierto o plegado) y lo aplica al `body`: `toggle()`, `open()`, `close()`, `sidebar-open`, `sidebar-collapse` y `sidebar-closed`, como AdminLTE.
- [x] Plegado automático al cruzar los 992 px y cierre al navegar donde el menú se superpone.
- [x] La capa oscura que cierra el menú al tocar fuera (`#sidebar-overlay`), en la plantilla del layout.
- [x] El botón de la barra superior llama a `SidebarService.toggle()` en lugar de `data-widget="pushmenu"`.
- [x] `app.component` deja de borrar las clases del `body` en cada navegación, o el servicio las vuelve a poner.
- [x] Fuera las llamadas a `Treeview` (el menú no tiene submenús) y a `Layout()` (comprobar con CSS las alturas del contenido y del menú en páginas cortas).
- [x] Fuera `src/assets/initMainPage.js` y `window.AppAdminLTE`.
- [x] Pruebas unitarias del servicio.
- [x] Comprobado en móvil, tableta y escritorio, y con el menú plegado (solo iconos) en escritorio.

**Resultado** (15 de octubre de 2026): pasan las 16 comprobaciones de la fase 0, sin errores de página; 248 pruebas en verde.

- **Cambio de comportamiento:** el estado del menú se conserva al navegar. Antes, `app.component` vaciaba las clases del `body` en cada navegación y el menú plegado volvía a desplegarse. Las páginas de inicio (*landing*) siguen empezando con el menú plegado.
- **Pendiente para la fase 4:** `Layout()` se sustituye por CSS en `styles.scss` (altura mínima del contenido, `height: auto` y desplazamiento del menú). Pero `adminlte.js` sigue cargado y vuelve a ejecutarlo al cargar la página, así que el CSS solo se podrá comprobar del todo al quitar ese script.

## Fase 2. Tarjetas

**Objetivo**: plegar, maximizar y cerrar tarjetas con directivas de Angular, y avisar con salidas (`@Output`) en lugar de eventos de jQuery.

- [x] Directiva `thumderCard` en cada `.card`:
  - métodos `collapse()`, `expand()`, `toggle()`, `maximize()` y `minimize()`;
  - salidas `collapsed`, `expanded`, `maximized` y `minimized`;
  - las mismas clases que AdminLTE (`collapsed-card`, `maximized-card`, también en `html`).
- [x] Directiva `thumderCardWidget="collapse | maximize"` para los botones y los títulos. Cambia el icono (`fa-minus`/`fa-plus`, `fa-expand`/`fa-compress`) y pone `aria-expanded`.
- [x] Un registro de tarjetas para plegarlas todas a la vez (multivista) y saber cuándo cambia alguna.
- [x] Cambiar los 49 `data-card-widget` de las 13 plantillas.
- [x] Cambiar las escuchas `*.lte.cardwidget` de `code`, `memory`, `registers`, `editor`, `multiples-views` y `app.component` por las salidas de la directiva.
- [x] Cambiar `CardWidget("collapse")` de `registers` y `multiples-views`.
- [x] Revisar los apaños de tamaño que dependían de esos eventos (`dispatchEvent(new Event("resize"))`, `Utils.wait(500)`). Quitar los que ya resuelven los `ResizeObserver`.
- [x] Pruebas unitarias de las directivas.
- [x] Comprobado: plegar y maximizar en código, memoria, registros, editor, pipeline, ciclos, estadísticas, calculadora, configuración, multivista y ventana de depuración. Las tablas recuperan su altura.

**Resultado** (15 de octubre de 2026): `src/app/__shared/directives/card/card.directive.ts`, exportada en `SharedModule`, con 5 pruebas unitarias. Pasan las 20 comprobaciones (las de la fase 0 y otras 4: registros plegados, editor, multivista y ventana de depuración), sin errores de página; 253 pruebas en verde.

- Las 20 tarjetas llevan `thumderCard`, con sus 30 botones de plegar y sus 18 de maximizar.
- **«Cerrar» no hace falta:** solo lo usaba la ventana de depuración, que ya se cierra con su propio `(click)`. Fuera el atributo.
- **El editor estaba roto:** sus escuchas esperaban un `#card-IDE` que no existía, así que no hacían nada. Ahora la tarjeta tiene ese id y, maximizada, el editor ocupa el 88 % del alto.
- **Animación:** sin la animación de jQuery (`slideUp` de 400 ms), las tarjetas se pliegan al instante. Las esperas de 500 ms antes de medir las tablas pasan a la siguiente vuelta del bucle de eventos, y la multivista ya no usa `Utils.wait(500)`.
- **Apaños de tamaño que quedan:** los `dispatchEvent(new Event("resize"))` de `refresh()`, `globals.service` y la barra superior no dependen de las tarjetas ni de jQuery. Se quedan para UI-02.

## Fase 3. Desplegables, ventanas modales y acordeones

**Objetivo**: los componentes de Bootstrap, con el mismo marcado y CSS, gobernados por Angular.

- [x] Directiva de desplegable:
  - abre y cierra el `.dropdown-menu`;
  - lo cierra al pulsar fuera, con Escape y al elegir una opción;
  - pone `aria-expanded` y devuelve el foco al botón.
- [x] Cambiar los 5 desplegables: «Páginas» e «Idioma» de la barra superior, y el idioma de `login`, `register` y `forgot-password`.
- [x] Servicio y directivas de ventana modal:
  - abrir y cerrar por id;
  - el fondo oscuro, `modal-open` en el `body`, cierre con Escape y al pulsar el fondo;
  - foco atrapado dentro (CDK `FocusTrap`) y devuelto al botón que la abrió.
- [x] Cambiar las 7 aperturas y los 6 cierres. El botón «Debug» del pie solo necesita quitar el atributo.
- [x] Acordeones con estado en el componente: los 6 de «Sobre nosotros», de los que solo uno está abierto a la vez, y el de `docs-item`.
- [x] Pruebas unitarias del desplegable y de la ventana modal.
- [x] Comprobado con ratón, teclado y tacto.

**Resultado** (15 de octubre de 2026): `src/app/__shared/directives/bootstrap/` (`dropdown`, `collapse` y `modal`), exportadas en `SharedModule` (y en `AccountModule` y `LandingModule`, que no lo importan), con 6 pruebas unitarias. Pasan 25 comprobaciones: las anteriores y otras 5, que son foco y clic fuera en la modal, la modal de información del diagrama de ciclos, el teclado en los desplegables, el acordeón de la documentación y el desplegable táctil. Sin errores de página; 259 pruebas en verde.

- Ya no queda ningún atributo `data-toggle`, `data-dismiss`, `data-target`, `data-parent`, `data-widget` ni `data-card-widget` en `src/app`.
- **Accesibilidad:**
  - las opciones de idioma de `login`, `register` y `forgot-password` eran enlaces sin `href` (el teclado no llegaba a ellas) y ahora son botones;
  - los acordeones ponen `aria-expanded` y `aria-controls`;
  - las modales ponen `aria-modal` y atrapan el foco.
- **Hasta la fase 4:** mientras Bootstrap siga cargado, su manejador global de teclado de `.dropdown-menu` también ve las flechas. Las comprobaciones pasan igualmente.

## Fase 4. Quitar jQuery

**Objetivo**: fuera jQuery y lo que solo estaba por él.

- [x] La ventana de depuración desplaza con `element.scrollTo({ behavior: "smooth" })`.
- [x] Fuera `jQuery: any` y `$: any` de `Types.ts` y `typings.d.ts`. TypeScript debe encontrar cualquier uso que quede.
- [x] `angular.json`:
  - fuera los scripts `jquery`, `bootstrap.bundle`, `jquery.overlayScrollbars`, `adminlte.js`, `jquery.mousewheel`, `raphael`, `chart.umd.js` e `initMainPage.js`;
  - fuera el estilo `OverlayScrollbars.css`;
  - fuera `jquery` de `allowedCommonJsDependencies` (no estaba).
- [x] `package.json`: fuera `jquery` y `@types/jquery`. `admin-lte` se queda por su CSS.
- [x] `grep` sin resultados de `jQuery`, `window.$`, `data-toggle`, `data-dismiss`, `data-widget` ni `data-card-widget` en `src/app`.
- [x] La compilación de producción no contiene jQuery. Medir de nuevo `scripts-*.js`.

**Resultado** (15 de octubre de 2026): pasan las 25 comprobaciones sin jQuery, Bootstrap JS ni AdminLTE JS, y sin errores de página; 259 pruebas en verde; lint sin errores (69 avisos, eran 74).

- **Tamaño:** `scripts-*.js` pasa de 1.119.430 a 536.414 bytes (un 52 % menos). El total inicial pasa de 9,19 MB a 8,60 MB (de 1,73 a 1,56 MB comprimido).
- **`Layout()`:** el CSS lo sustituye, medido con la misma prueba que antes. En escritorio y en móvil coinciden la altura mínima del contenido, el alto de la página (900 y 971 px en escritorio; 844 y 1220 px en móvil) y la posición del pie. El menú lateral se desplaza con la barra nativa.
- **`jquery` sigue en `node_modules`:** es dependencia de `admin-lte`, que se queda por su CSS. No entra en la compilación.
- **De paso, un fallo de la ventana de depuración:** al pasar de 100 líneas quitaba la más nueva en vez de la más antigua, así que dejaba de mostrar las nuevas.

## Fase 5. Verificación final y documentación

**Objetivo**: comprobar que no se ha perdido nada y dejarlo documentado.

- [x] Lint, pruebas unitarias y compilaciones de desarrollo y producción.
- [x] El script de la fase 0, en Chromium, sin errores de página: menú, tarjetas, desplegables, modales, acordeones, cookies y resaltado.
- [x] La auditoría de la interfaz adaptable en los cinco tamaños, sin desbordamientos.
- [x] Electron con `build:prod` (`file://`): menú, tarjetas y ventana de editar registro.
- [x] Marcar UI-02 en `TODO-mejoras.md` y actualizar el inventario de «Estado medido» (usos de jQuery: 0).
- [x] Anotar el tamaño de `scripts-*.js` antes y después.

**Resultado** (15 de octubre de 2026):

- 259 pruebas unitarias en verde (11 nuevas: 5 de tarjetas y 6 de desplegable, acordeón y modal; y las 4 del menú lateral, reescritas).
- Lint sin errores (69 avisos, eran 74).
- Compilaciones de desarrollo, producción y Electron (`build:prod`) correctas.
- **Chromium:** 25 comprobaciones de interacción sin errores de página.
- **Auditoría adaptable:** 90 de 90 (18 rutas en 5 tamaños), sin desbordamientos. Las capturas de móvil y tableta son idénticas a las de antes. En escritorio solo se mueve 1 px el texto del menú lateral, porque la barra de desplazamiento nativa ocupa el lugar de la de OverlayScrollbars.
- **Electron** (`file://`): `window.jQuery` no existe, `window.thumder` sí y la página no tiene `require`. El menú lateral, las tarjetas, el desplegable de idioma y la modal de editar registro funcionan, sin errores de página.

## Después del plan

- **Fuera los apaños de `resize`:** las tablas con desplazamiento virtual del CDK se miden solas cuando cambia su tamaño (`src/app/__shared/directives/virtual-scroll/viewport-resize.directive.ts`). Ya no queda ningún `dispatchEvent(new Event("resize"))`; antes, el código lanzaba uno por cada fila que recibía.
- **Zoom** en el pipeline y en el diagrama de ciclos (lo que faltaba de UI-08).
- **Resaltado** de los bloques `bash` y `json` de la documentación (Prism).
- **BUG-27:** la vista de registros no mostraba el PC de cada ciclo. Lo encontró la comprobación nueva de que las tablas siguen a la simulación.
- El script de comprobación hace ahora 32 interacciones, y todas pasan.

