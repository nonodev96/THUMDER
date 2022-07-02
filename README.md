THUMDER
=======

<center>
  <img src="./assets/favicon.256x256.png" alt="ICON" width="10%" height="10%"/>
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
  Página del proyecto en producción <a href="https://thumder.netlify.com">THUMDER</a><br>
</center>

<center>
  Repositorio del servidor del proyecto <a href="https://github.com/nonodev96/THUMDER-server">THUMDER server</a>
</center>

## Instalación de las dependencias

```bash
sudo npm install -g  @angular/cli@12.5.0  # Instala la herramienta de desarrollo
npm install                               # Instala las dependencias
```

Tu necesitas aumenta la memoria de node, para ello se debe modificar la variable de entorno de node (`NODE_OPTIONS`),
para ello debemos asignar al menos 4Gb de memoria `--max_old_space_size=<size>`.

## Desarrollo


| **Commandos**                  | **Descripción**                                         |
|:-------------------------------|:--------------------------------------------------------|
| `npm run ng:serve-angular:dev` | Enciende el servidor de angular en modo de desarrollo   |
| `npm run ws:server`            | Enciende el servidor websocket, requiere THUMDER Server |

## Despliegue


| **Commandos**                         | **Descripción**                                                                                   |
|:--------------------------------------|:--------------------------------------------------------------------------------------------------|
| `npm run ng:build-angular:production` | Construye la aplicación angular de navegador con las variables de producción                      |
| `npm run electron:build`              | Construye la aplicación angular y encapsula la aplicación dentro electron generando un ejecutable |

El despliegue genera las carpetas `/dist`, `/dist-angular` y `/release`.

La carpeta `/dist-angular` es la indicada para el despliegue en servidores.

La carpeta `/release` contiene los ficheros ejecutables con la aplicación.

## Otros comandos


| **Commandos**                         | **Descripción** |
|:--------------------------------------|:----------------|
| `npm run ng:build:dev`                |                 |
| `npm run ng:build:web`                |                 |
| `npm run ng:build:production`         |                 |
| `npm run ng:build-angular:dev`        |                 |
| `npm run ng:build-angular:web`        |                 |
| `npm run ng:build-angular:production` |                 |
| `npm run ng:serve:dev`                |                 |
| `npm run ng:serve:web`                |                 |
| `npm run ng:serve:production`         |                 |
| `npm run ng:serve-angular:dev`        |                 |
| `npm run ng:serve-angular:web`        |                 |
| `npm run ng:serve-angular:production` |                 |

## Server e2e


| **Commandos**          | **Descripción**                                                                 |
|:-----------------------|:--------------------------------------------------------------------------------|
| `npm run cypress:open` | Abre la aplicación con cypress app y configura los comandos y pruebas           |
| `npm run cypress:run`  | Ejecuta las pruebas sobre el servidor (solo son visibles por linea de comandos) |

### Cobertura de navegadores

```bash
npx browserslist
npx browserslist --coverage
```

These browsers account for 86.79% of all users globally

## Versión actual de las dependencias

- Angular v12.5.0
- Electron v16.2.6
- Electron Builder v23.0.3
