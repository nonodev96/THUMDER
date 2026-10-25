# How to contribute to THUMDER

<!-- github-only -->
[Español](CONTRIBUTING.md) | **English**
<!-- /github-only -->

Thanks for helping. This guide explains how the code is organised, the conventions it follows and how it is tested and published. Getting started (requirements, `pnpm install`, Firebase) is in the [README](README.en.md).

## Structure

```
src/app/
  __core/            the core, without interface
    engine/          the DLX simulator: assembler, CPU, pipeline, traps and the Web Worker (runner.ts)
    machine/         MachineService (the state in signals), the model of the cycle clock diagram and its export
    config/          the typed, versioned and validated configuration (ConfigService)
    exercises/       guided exercises and exercises shared by link
    services/        files (IndexedDB and Firestore), theme, side menu, Electron
    numbers.ts       all the number conversions (binary, hexadecimal, IEEE 754)
  __shared/          directives (cards, modals, dropdowns), the virtual table, pipes and utilities
  components/        reusable components: Pixi canvases, Monaco, tools of the editor, bars
  views/_auth/       the views of the simulator (each one loads when it opens: auth.routes.ts)
  views/_account/    sign-in (optional: it only synchronises the files)
src/assets/          translations (i18n/es.json and en.json), DLX examples, exercises, documentation
src-electron/        the desktop application: main process, preload and their contract (see the README)
src-mobile/          the Android and iOS projects (Capacitor: capacitor.config.ts and docs/movil.en.md)
e2e/                 end to end tests (Playwright)
test/                tests of the Firestore rules (emulator)
docs/                the documentation, in Spanish (x.md) and English (x.en.md): the user guide (guide/), the simulator
                     and its protocol, SuperDLX, the examples, the mobile applications and the WinDLX manual
```

The architecture of the simulator and the protocol between the page and the Web Worker are in [docs/simulador.en.md](docs/simulador.en.md).

## Conventions

- **Angular without modules**: standalone components, `inject()`, *signals* and `OnPush` in the views that read `MachineService.state`. No view keeps a copy of the state of the machine.
- **Interface**: AdminLTE 3 and Bootstrap 4 (CSS only) with the Angular CDK and the own directives of `__shared/directives` (no jQuery or Angular Material).
- **Colours**: all of them are variables of `:root` in `src/theme.scss` (the light theme, and the dark one in `:root[data-theme="dark"]`). The components use `var(--thumder-...)`; the PixiJS canvases and the exports read the same variables with `palette.ts`. Only the places that cannot read variables (the theme of Monaco and the arrows the simulator generates) have the value written, with a comment that says which variable it matches.
- **Dependencies, only the needed ones**: what is little code is done in the project instead of adding a package. The notices are `ToastService` (`__core/services/toast`), privacy is `ConsentService` and its banner (`components/consent`), the log of the simulation is a view of its own (`views/_auth/logger`), and `scripts/parallel.mjs` and `scripts/wait-port.mjs` start Electron with the development server (`pnpm start`). Before adding a dependency, check whether it fits in a few dozen lines.
- **Privacy**: nothing leaves the browser without saying so in `src/assets/legal/privacy.*.md`. What is optional (analytics, error reports) goes through `ConsentService`; if what is asked changes, raise `CONSENT_VERSION` so that the banner shows again. The legal texts (privacy, legal notice, accessibility) are in `src/assets/legal`, in Spanish and English.
- **Texts**: all those of the interface in `src/assets/i18n/es.json` and `en.json`, with the same keys (a test checks it). Icon buttons have a translated `title` and `aria-label`.
- **Accessibility**: each view passes axe (WCAG 2.1 A and AA) in the light and dark themes (`e2e/a11y.spec.ts`), with no rules turned off. Contrast of 4.5:1 and nothing told apart only by colour.
- **Security**: the CSP of `src/index.html` does not allow `eval` or inline scripts. The Electron page has no Node.js: what it needs is exposed by `src-electron/preload`, with the channels of `src-electron/shared/contract.ts`; the main process validates everything it gets.
- **Code**: strict TypeScript, format and lint with Biome (`pnpm run lint:fix`). The comments of the code are in English.
- **Documentation**: in Spanish (`x.md`) and English (`x.en.md`), with the same sections; if you change one, change the other. A new page goes in `docs/guide/` and in the catalogue (`src/app/views/_auth/docs/docs.catalog.ts`), with its title in `DOCS.PAGES` of both translations. Short sentences, the names of the buttons as they appear in the interface and relative links between pages: inside THUMDER they open the page in the language of the application. Screenshots go in `docs/guide/img/` (`x.png` in Spanish and `x.en.png` in English). The [wiki](https://github.com/nonodev96/THUMDER/wiki) is generated from `docs/`: `git submodule update --init wiki` the first time, `pnpm run wiki`, and then commit and push inside `wiki/`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`...), because the CHANGELOG is generated from them.

## Tests

| Command | What it tests |
| :-- | :-- |
| `pnpm test` | Unit tests (Vitest): the engine, the conversions, the services, the files, the exercises |
| `pnpm test:electron` | The desktop application without opening Electron: settings, theme, menus, texts, sizes and validation |
| `pnpm test:rules` | The Firestore rules in the emulator (needs Java) |
| `pnpm e2e` | The web application on desktop, phone and tablet, with axe; phone and tablet also with WebKit (iOS) |
| `xvfb-run -a pnpm e2e:electron` | The desktop application (on Linux without a screen, with `xvfb-run`) |
| `pnpm run lint` | Lint and format |

Before proposing a change: lint without errors, the unit tests and the e2e tests that touch what changed. A new bug of the simulator is fixed with a test in `src/app/__core/engine/*.spec.ts` that reproduces it; the examples of `src/assets/examples-dlx` are checked in `classics.spec.ts` and the exercises in `exercises.spec.ts`.

## Publish

1. `pnpm version minor` (or `patch`): raises the version and adds to the CHANGELOG the `feat`, `fix` and `perf` since the previous one (`scripts/changelog.mjs`). If you write the section of that version in CHANGELOG.md by hand first, yours stays.
2. `git push --follow-tags`: the `v*` tag starts two workflows:
   - `deploy-netlify.yaml` deploys the web;
   - `create-release.yaml` creates a draft *release* with the executables of Linux, Windows and macOS (and the Android AAB and APK, if its key is there), the `latest*.yml` files and the notes of the CHANGELOG.
3. Review the draft on GitHub and publish it.

The binaries are not signed (there are no certificates): the notes say so. The Firestore rules are published separately: `pnpm exec firebase deploy --only firestore:rules`.
