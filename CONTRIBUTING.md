# Cómo contribuir a THUMDER

Gracias por ayudar. Esta guía explica cómo está organizado el código, las convenciones que sigue y cómo se prueba y se publica. La puesta en marcha (requisitos, `pnpm install`, Firebase) está en el [README](README.md).

## Estructura

```
src/app/
  __core/            el núcleo, sin interfaz
    engine/          el simulador DLX: ensamblador, CPU, pipeline, traps y el Web Worker (runner.ts)
    machine/         MachineService (el estado en signals), el modelo del diagrama de ciclos y su exportación
    config/          la configuración tipada, versionada y validada (ConfigService)
    exercises/       ejercicios guiados y compartidos por enlace
    services/        ficheros (IndexedDB y Firestore), tema, menú lateral, Electron
    numbers.ts       todas las conversiones de números (binario, hexadecimal, IEEE 754)
  __shared/          directivas (tarjetas, modales, desplegables), la tabla virtual, pipes y utilidades
  components/        componentes reutilizables: lienzos de Pixi, Monaco, herramientas del editor, barras
  views/_auth/       las vistas del simulador (cada una se carga al abrirse: auth.routes.ts)
  views/_account/    inicio de sesión (opcional: solo sincroniza los ficheros)
src/assets/          traducciones (i18n/es.json y en.json), ejemplos DLX, ejercicios, documentación
e2e/                 pruebas de extremo a extremo (Playwright)
test/                pruebas de las reglas de Firestore (emulador)
docs/                el simulador y su protocolo, el manual de WinDLX y los ejemplos
```

La arquitectura del simulador y el protocolo entre la página y el Web Worker están en [docs/simulador.md](docs/simulador.md).

## Convenciones

- **Angular sin módulos**: componentes independientes, `inject()`, *signals* y `OnPush` en las vistas que leen `MachineService.state`. Ninguna vista guarda una copia del estado de la máquina.
- **Interfaz**: AdminLTE 3 y Bootstrap 4 (solo CSS) con el CDK de Angular y las directivas propias de `__shared/directives` (sin jQuery ni Angular Material).
- **Colores**: todos son variables de `:root` en `src/theme.scss` (el tema claro, y el oscuro en `:root[data-theme="dark"]`). Los componentes usan `var(--thumder-...)`; los lienzos de PixiJS y las exportaciones leen las mismas variables con `palette.ts`. Solo llevan el valor escrito los sitios que no pueden leer variables (el tema de Monaco y las flechas que genera el simulador), con un comentario que dice a qué variable corresponden.
- **Dependencias, las justas**: lo que es poco código se hace en el proyecto en lugar de añadir un paquete. Los avisos son `ToastService` (`__core/services/toast`), la privacidad `ConsentService` y su banner (`components/consent`), el registro de la simulación una vista propia (`views/_auth/logger`), y `scripts/parallel.mjs` y `scripts/wait-port.mjs` arrancan Electron con el servidor de desarrollo (`pnpm start`). Antes de añadir una dependencia, mira si cabe en unas decenas de líneas.
- **Privacidad**: nada sale del navegador sin decirlo en `src/assets/legal/privacy.*.md`. Lo opcional (analíticas, informes de errores) pasa por `ConsentService`; si cambia lo que se pregunta, sube `CONSENT_VERSION` para que el banner vuelva a salir. Los textos legales (privacidad, aviso legal, accesibilidad) están en `src/assets/legal`, en español e inglés.
- **Textos**: todos los de la interfaz en `src/assets/i18n/es.json` y `en.json`, con las mismas claves (una prueba lo comprueba). Los botones de icono llevan `title` y `aria-label` traducidos.
- **Accesibilidad**: cada vista pasa axe (WCAG 2.1 A y AA) en los temas claro y oscuro (`e2e/a11y.spec.ts`), sin reglas desactivadas. Contraste de 4,5:1 y nada que se distinga solo por el color.
- **Seguridad**: la CSP de `src/index.html` no permite `eval` ni scripts en línea. La página de Electron no tiene Node.js: lo que necesita lo expone `preload.ts`.
- **Código**: TypeScript estricto, formato y lint con Biome (`pnpm run lint:fix`). Los comentarios del código están en inglés; la documentación, en español.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`...), porque el CHANGELOG se genera a partir de ellos.

## Pruebas

| Comando | Qué prueba |
| :-- | :-- |
| `pnpm test` | Pruebas unitarias (Vitest): el motor, las conversiones, los servicios, los ficheros, los ejercicios |
| `pnpm test:rules` | Las reglas de Firestore en el emulador (necesita Java) |
| `pnpm e2e` | La aplicación web en escritorio, móvil y tableta, con axe |
| `xvfb-run -a pnpm e2e:electron` | La aplicación de escritorio (en Linux sin pantalla, con `xvfb-run`) |
| `pnpm run lint` | Lint y formato |

Antes de proponer un cambio: lint sin errores, las pruebas unitarias y las e2e que toquen lo cambiado. Un fallo nuevo del simulador se corrige con una prueba en `src/app/__core/engine/*.spec.ts` que lo reproduzca; los ejemplos de `src/assets/examples-dlx` se comprueban en `classics.spec.ts` y los ejercicios en `exercises.spec.ts`.

## Publicar

1. `pnpm version minor` (o `patch`): sube la versión y añade al CHANGELOG los `feat`, `fix` y `perf` desde la anterior (`scripts/changelog.mjs`). Si antes escribes a mano la sección de esa versión en CHANGELOG.md, se queda la tuya.
2. `git push --follow-tags`: la etiqueta `v*` lanza dos flujos:
   - `deploy-netlify.yaml` despliega la web;
   - `create-release.yaml` crea un borrador de *release* con los ejecutables de Linux, Windows y macOS, los `latest*.yml` y las notas del CHANGELOG.
3. Revisa el borrador en GitHub y publícalo.

Los binarios no están firmados (no hay certificados): las notas lo avisan. Las reglas de Firestore se publican aparte: `pnpm exec firebase deploy --only firestore:rules`.
