THUMDER
=======

<center>
  <img src="./src/assets/icons/favicon.256x256.png" alt="ICON" width="10%" height="10%"/>
</center>

<center>
  <a href="https://angular.io/">
    <img src="https://www.vectorlogo.zone/logos/angular/angular-icon.svg" alt="Angular Logo" width="10%" height="10%"/>
  </a>
  <a href="https://electronjs.org/">
    <img src="https://www.vectorlogo.zone/logos/electronjs/electronjs-icon.svg" alt="Electron Logo">
  </a>
</center>

<center>
  <a href="https://app.netlify.com/sites/thumder/deploys">
    <img src="https://api.netlify.com/api/v1/badges/491cdbc6-34ea-4ef0-92c0-be4f2a2ec3cb/deploy-status" alt="Netlify Status">
  </a>
</center>

<center>
  <a href="https://thumder.netlify.com">THUMDER page</a>
</center>

## Installation

```bash
sudo npm install -g  @angular/cli@12.2.10
npm install 
# npm install --only=prod
```

## Included Commands

### Develop

| Command                        | Description                    |
|:-------------------------------|:-------------------------------|
| `npm run ng:serve-angular:dev` | Develop the app in the browser |

### Deploy

| Command                               | Description                                                                          |
|:--------------------------------------|:-------------------------------------------------------------------------------------|
| `npm run ng:build-angular:production` | Deploy Angular app for browser version                                               |
| `npm run electron:build`              | Builds your application and creates an app consumable based on your operating system |

### Others command

| Command                                 | Description   |
|:----------------------------------------|:--------------|
| `npm run ng:build:dev`                  |               |
| `npm run ng:build:web`                  |               |
| `npm run ng:build:production`           |               |
| `npm run ng:build-angular:dev`          |               |
| `npm run ng:build-angular:web`          |               |
| `npm run ng:build-angular:production`   |               |
| `npm run ng:serve:dev`                  |               |
| `npm run ng:serve:web`                  |               |
| `npm run ng:serve:production`           |               |
| `npm run ng:serve-angular:dev`          |               |
| `npm run ng:serve-angular:web`          |               |
| `npm run ng:serve-angular:production`   |               |

You need to change de space of node with `NODE_OPTIONS` `--max_old_space_size=<size>`

**Your application is optimised. Only /dist folder and node dependencies are included in the executable.**

## You want to use a specific lib (like rxjs) in electron main thread ?

YES! You can do it! Just by importing your library in npm dependencies section (not **devDependencies**)
with `npm install --save`. It will be loaded by electron during build phase and added to your final package. Then use
your library by importing it in `main.ts` file. Quite simple, isn't it ?

## Unit Tests

| Command  | Description                                                  |
|:---------|:-------------------------------------------------------------|
| ng test  | Run unit tests with karma, for components, views and modules |

## E2E Testing

E2E Test scripts can be found in `e2e` and `cypress` folder.

## Server e2e

| Command                 | Description                                 |
|:------------------------|:--------------------------------------------|
| `npm run ng:server`     | Start the server                            |
| `npm run cypress:open`  | Open cypress app and configure the commands |
| `npm run cypress:run`   | Run tests of cypress (BUG)                  |

Note: To make it work behind a proxy, you can add this proxy exception in your terminal
`export {no_proxy,NO_PROXY}="127.0.0.1,localhost"`

### Coverage

```bash
npx browserslist
npx browserslist --coverage
```

These browsers account for 86.79% of all users globally

## Currently, runs with:

- Angular v12.2.10
- Electron v12.2.2
- Electron Builder v22.10.5

[//]: #
