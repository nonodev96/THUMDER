# THUMDER

<p align="center">
  <img src="./assets/favicon.256x256.png" alt="ICON" width="256px" height="256px"/>
</p>

Página del proyecto en producción <a href="https://thumder.netlify.app">THUMDER</a>

## ¿Qué es THUMDER?

**THUMDER** es un simulador visual interactivo y entorno de desarrollo (IDE) diseñado para la arquitectura del repertorio de instrucciones **DLX**. Su objetivo principal es facilitar el estudio y la comprensión del funcionamiento interno de un procesador segmentado, permitiendo a estudiantes y desarrolladores observar en tiempo real cómo se ejecutan las instrucciones y cómo interactúan los distintos componentes de la arquitectura.

Desarrollado sobre tecnologías web modernas (**Angular** y **Electron**), THUMDER ofrece una interfaz gráfica multiplataforma (Windows, Linux, macOS) con su propio motor de simulación, que se ejecuta en un Web Worker, en el navegador o en la aplicación de escritorio, sin servidor.

### Características Principales

- **Editor Integrado y Gestor de Ficheros:** Escribe y administra tu propio código ensamblador DLX directamente en la aplicación, definiendo puntos de ruptura (_breakpoints_) para facilitar la depuración.
- **Simulación Precisa:** Ejecuta programas paso a paso (instrucción a instrucción) o visualiza los cambios detallados ciclo a ciclo de reloj.
- **Visualización del Cauce (Pipeline):** Sigue el recorrido de cada instrucción a través de las 5 etapas clásicas del procesador DLX
  - **Fetch** (Búsqueda)
  - **Decode** (Decodificación)
  - **Execute** (Ejecución)
  - **Memory-Access** (Acceso a memoria)
  - **Write-Result** (Escritura de resultados)
- **Control de Memoria y Registros:** Inspecciona y modifica el valor de los registros del procesador y de la memoria principal de forma dinámica durante la simulación.
- **Diagrama de Ciclos de Reloj:** Analiza gráficamente la superposición de instrucciones y comprende cómo la arquitectura resuelve los adelantamientos (_forwarding_) y los riesgos estructurales, de datos y de control.
- **Análisis Estadístico:** Obtén métricas y estadísticas detalladas de rendimiento al realizar las simulaciones.
- **Interfaz Múltiple Personalizable:** Un entorno modular (_Multiview_) que permite reorganizar las diferentes vistas (código, pipeline, memoria, diagramas) mediante un sistema flexible de arrastrar y soltar (_drag and drop_).
- **Para aprender:** cada atasco del diagrama se explica (qué registro, qué instrucción lo causa y si el adelantamiento lo habría evitado), el programa se compara con y sin adelantamiento, se puede dar un paso atrás, ver la ruta de datos del ciclo y hacer ejercicios guiados que se comprueban con la simulación. Un programa se comparte como ejercicio con un enlace.
- **Sin cuenta:** se usa como invitado y los ficheros se guardan en el navegador; con una cuenta se sincronizan entre dispositivos. Se importan y descargan `.s` y `.zip`.
- **Accesible:** tema claro u oscuro, alternativas en texto a los diagramas y comprobación con axe (WCAG 2.1 AA) en cada vista.

## El simulador

THUMDER ensambla los programas en código máquina DLX real, los carga en memoria y los simula ciclo a ciclo con el pipeline de WinDLX (adelantamiento, detenciones, unidades de coma flotante configurables, traps de entrada y salida y estadísticas), sin necesidad de servidor. Cómo funciona y cómo se comprueba: [docs/simulador.md](docs/simulador.md). El manual de WinDLX en el que se basa: [docs/manual-simulador-dlx.md](docs/manual-simulador-dlx.md).

Para aprender DLX hay 20 ejemplos clásicos comentados, de «Hola, mundo» a un bucle DAXPY desenrollado y un catálogo de riesgos del pipeline: [docs/ejemplos-dlx.md](docs/ejemplos-dlx.md). Están siempre en la carpeta «ejemplos» del gestor de ficheros, de solo lectura, junto a «ejercicios» con los programas de los ejercicios guiados: si cambias uno, se guarda una copia en tus ficheros.

## Puesta en marcha

Requisitos: Node.js 22 (o 20.19 o posterior) y pnpm 10 (`corepack enable` instala la versión de `packageManager`).

```bash
git clone --recurse-submodules git@github.com:nonodev96/THUMDER.git
cd THUMDER
pnpm install

```

`pnpm install` crea los ficheros de entorno (`src/environments/environment.{dev,web,production}.ts`) a partir de `src/environments/_environment.ts`. Están en `.gitignore` porque llevan las claves de Firebase:

- **Sin claves de Firebase** (modo local): no hay cuentas, se entra como invitado, los ficheros se guardan en el navegador (IndexedDB) y no hay analítica. Es lo que hace falta para desarrollar y para las pruebas.
- **Con claves de Firebase**: también se entra como invitado; una cuenta (correo, Google o GitHub) sincroniza los ficheros con Firestore. Analítica solo si se aceptan las cookies. Las reglas de Firestore están en `firestore.rules` (se prueban con `pnpm test:rules`).

## Desarrollo

| **Comando**                | **Descripción**                                                                       |
| :------------------------- | :------------------------------------------------------------------------------------ |
| `pnpm run ng:serve:dev`    | Arranca la aplicación web en <http://localhost:4200>                                  |
| `pnpm start`               | Aplicación web y Electron a la vez (Electron carga `localhost:4200`)                  |
| `pnpm test`                | Pruebas unitarias (Vitest)                                                            |
| `pnpm test:rules`          | Las reglas de Firestore en el emulador (necesita Java)                                |
| `pnpm e2e`                 | Pruebas e2e (Playwright) en escritorio, móvil y tableta, con axe; arranca `ng serve`  |
| `pnpm e2e:electron`        | Compila la aplicación de escritorio y la prueba (en Linux sin pantalla: `xvfb-run -a`) |
| `pnpm run lint`            | Lint y formato (Biome)                                                                |

En el simulador: <kbd>Mayús</kbd>+<kbd>F5</kbd> carga el código, <kbd>F5</kbd> ejecuta o pausa, <kbd>F10</kbd> avanza un ciclo, <kbd>Mayús</kbd>+<kbd>F10</kbd> retrocede uno y <kbd>F8</kbd> ejecuta hasta el final sin dibujar.

Cómo contribuir (estructura, convenciones, pruebas y publicación): [CONTRIBUTING.md](CONTRIBUTING.md).

## Compilación y despliegue

| **Comando**                      | **Descripción**                                                               |
| :------------------------------- | :---------------------------------------------------------------------------- |
| `pnpm run ng:build:production`   | Aplicación web optimizada en `dist/browser` (la que se despliega en Netlify)  |
| `pnpm run build:prod`            | Aplicación para Electron (`--base-href ./`) y `main.js`/`preload.js`          |
| `pnpm run electron:build`        | Ejecutable de escritorio en `release/` (AppImage; instalador y portable de Windows; `.dmg` y `.zip` de macOS) |

Los flujos de GitHub Actions:

| **Flujo** | **Cuándo** | **Qué hace** |
| :-- | :-- | :-- |
| `ci.yaml` | cada push a `dev` y `master` y cada PR | lint, compilación, pruebas unitarias y e2e (Chromium y Electron) |
| `deploy-netlify.yaml` | etiqueta `v*` o a mano (*Run workflow*) | pruebas, compilación y despliegue en producción en Netlify |
| | cada PR | vista previa en `https://pr-<número>--<sitio>.netlify.app`, enlazada desde el PR |
| | cada push a `dev` | vista previa en `https://dev--<sitio>.netlify.app` |
| `create-release.yaml` | etiqueta `v*` | crea un borrador de versión con los ejecutables de Linux, Windows y macOS, los `latest*.yml` y las notas del CHANGELOG |

Para desplegar en Netlify hacen falta dos secretos del repositorio: `NETLIFY_AUTH_TOKEN` (un token personal de Netlify, en *User settings → Applications*) y `NETLIFY_SITE_ID` (en *Project configuration → Project ID*). Con el secreto opcional `ANGULAR_ENVIROTMENT_PRODUCTION` (el fichero `src/environments/environment.production.ts` en base64) la web lleva las claves de Firebase; sin él se compila en modo local. Los PR de forks y de Dependabot no tienen acceso a los secretos y no se despliegan.

La aplicación de escritorio no da a la página acceso a Node.js: lo que necesita de Electron (abrir enlaces en el navegador y las notificaciones) lo expone `preload.ts` como `window.thumder`. La página tiene una política de seguridad de contenidos (CSP en `src/index.html`) sin `eval` ni scripts en línea, y el paquete de escritorio solo lleva `main.js`, `preload.js` y la aplicación compilada.

## Pruebas e2e

Están en `e2e/` y usan Playwright. La primera vez hay que instalar el navegador: `pnpm exec playwright install chromium`.

- `pnpm e2e` comprueba en escritorio (1440×900), móvil (Pixel 7) y tableta (820×1180), sin errores en la página:
  - la interfaz: menú lateral, desplegables, tarjetas, modales, acordeones y zoom de los diagramas;
  - la simulación: consola, puntos de ruptura, errores de ensamblado y coma flotante;
  - los ejemplos y la configuración;
  - la interfaz adaptable en 5 tamaños, y la accesibilidad de cada vista (axe).
- `pnpm e2e:electron` prueba la aplicación de escritorio: carga con `file://`, sin Node.js en la página.
- Además: el gestor de ficheros (importar y exportar), las herramientas para aprender (paso atrás, atascos, comparación, ejercicios, ruta de datos) y la accesibilidad en los temas claro y oscuro.

Las pruebas que dependen de un tamaño llevan la etiqueta `@movil` o `@tableta`. Las capturas y las trazas de las que fallan quedan en `test-results/`, y el informe, en `playwright-report/`.

### Cobertura de navegadores

```bash
pnpm exec browserslist
pnpm exec browserslist --coverage
```

These browsers account for 86.79% of all users globally

## Documentación (Wiki)

La documentación detallada sobre el uso y funcionamiento de la aplicación se encuentra en el directorio `wiki/`:

- [Instalación](https://github.com/nonodev96/THUMDER/wiki/0.Installation)
- [Cuenta](https://github.com/nonodev96/THUMDER/wiki/00.Account)
- [Ejecución de instrucciones](https://github.com/nonodev96/THUMDER/wiki/00.TheExecutionOfInstructions)
- [La ventana de los registros](https://github.com/nonodev96/THUMDER/wiki/01.TheRegisterWindow)
- [La memoria](https://github.com/nonodev96/THUMDER/wiki/02.TheMemoryWindow)
- [La ventana de código](https://github.com/nonodev96/THUMDER/wiki/03.TheCodeWindow)
- [La ventana del diagrama de ciclos de reloj](https://github.com/nonodev96/THUMDER/wiki/04.TheClockCycleDiagramWindow)
- [La ventana del cauce de ejecución (Pipeline)](https://github.com/nonodev96/THUMDER/wiki/04.ThePipelineWindow)
- [Estadísticas](https://github.com/nonodev96/THUMDER/wiki/05.TheStatisticsWindow)
- [Puntos de ruptura (breakpoints)](https://github.com/nonodev96/THUMDER/wiki/06.TheBreakpoints)
- [El proceso de simulación](https://github.com/nonodev96/THUMDER/wiki/07.TheExecutionProcess)
- [Editar configuración](https://github.com/nonodev96/THUMDER/wiki/08.TheConfiguration)
- [Gestor de ficheros](https://github.com/nonodev96/THUMDER/wiki/09.FileManager)
- [Editor de ficheros](https://github.com/nonodev96/THUMDER/wiki/10.FileEditor)
- [Vista múltiple](https://github.com/nonodev96/THUMDER/wiki/11.Multiview)
