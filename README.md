THUMDER
=======

# Introduction | THUMDER

[![Schematic DLX](https://raw.githubusercontent.com/nonodev96/THUMDER/dev/assets/Datapath_Schematic.svg](./assets/Datapath_Schematic.svg)

[![License](http://img.shields.io/badge/Licence-MIT-brightgreen.svg)](LICENSE.md)


# Introduction | Angular - Electron

[![Angular Logo](https://www.vectorlogo.zone/logos/angular/angular-icon.svg)](https://angular.io/)
[![Electron Logo](https://www.vectorlogo.zone/logos/electronjs/electronjs-icon.svg)](https://electronjs.org/)


## Currently, runs with:

- Angular v10.2.5
- Electron v8.4.1
- Electron Builder v22.8.1


## Included Commands

| Command                  | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `npm run ng:serve`       | Execute the app in the browser                                                       |
| `npm run build`          | Build the app. Your built files are in the /dist folder.                             |
| `npm run build:prod`     | Build the app with Angular aot. Your built files are in the /dist folder.            |
| `npm run electron:local` | Builds your application and start electron                                           |
| `npm run electron:build` | Builds your application and creates an app consumable based on your operating system |


You need to change de space of node with `NODE_OPTIONS` `--max_old_space_size=<size>`

**Your application is optimised. Only /dist folder and node dependencies are included in the executable.**

## You want to use a specific lib (like rxjs) in electron main thread ?

YES! You can do it! Just by importing your library in npm dependencies section (not **devDependencies**) with `npm install --save`. It will be loaded by electron during build phase and added to your final package. Then use your library by importing it in `main.ts` file. Quite simple, isn't it ?

## E2E Testing

E2E Test scripts can be found in `e2e` and `cypress` folder.

### Electron e2e

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run e2e`   | Execute end to end tests of electron  |

### Server e2e

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run ng:server`    | Start the server                                   |
| `npm run cypress:open` | Open cypress app and configure the commands        |
| `npm run cypress:run`  | Run tests of cypress (BUG)                         |

Note: To make it work behind a proxy, you can add this proxy exception in your terminal
`export {no_proxy,NO_PROXY}="127.0.0.1,localhost"`
