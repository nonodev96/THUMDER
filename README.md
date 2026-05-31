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

## ¿Qué es THUMDER?

**THUMDER** es un simulador visual interactivo y entorno de desarrollo (IDE) diseñado para la arquitectura del repertorio de instrucciones **DLX**. Su objetivo principal es facilitar el estudio y la comprensión del funcionamiento interno de un procesador segmentado, permitiendo a estudiantes y desarrolladores observar en tiempo real cómo se ejecutan las instrucciones y cómo interactúan los distintos componentes de la arquitectura.

Desarrollado sobre tecnologías web modernas (**Angular** y **Electron**), THUMDER ofrece una interfaz gráfica multiplataforma (Windows, Linux, macOS) que se apoya en un motor de simulación gestionado por [THUMDER Server](https://github.com/nonodev96/THUMDER-server).

### Características Principales

- 💻 **Editor Integrado y Gestor de Ficheros:** Escribe y administra tu propio código ensamblador DLX directamente en la aplicación, definiendo puntos de ruptura (*breakpoints*) para facilitar la depuración.
- ⚙️ **Simulación Precisa:** Ejecuta programas paso a paso (instrucción a instrucción) o visualiza los cambios detallados ciclo a ciclo de reloj.
- 📊 **Visualización del Cauce (Pipeline):** Sigue el recorrido de cada instrucción a través de las 5 etapas clásicas del procesador DLX (*Fetch, Decode, Execute, Memory-Access, Write-Result*).
- 🧠 **Control de Memoria y Registros:** Inspecciona y modifica el valor de los registros del procesador y de la memoria principal de forma dinámica durante la simulación.
- ⏱️ **Diagrama de Ciclos de Reloj:** Analiza gráficamente la superposición de instrucciones y comprende cómo la arquitectura resuelve los adelantamientos (*forwarding*) y los riesgos estructurales, de datos y de control.
- 📈 **Análisis Estadístico:** Obtén métricas y estadísticas detalladas de rendimiento al realizar las simulaciones.
- 🪟 **Interfaz Múltiple Personalizable:** Un entorno modular (*Multiview*) que permite reorganizar las diferentes vistas (código, pipeline, memoria, diagramas) mediante un sistema flexible de arrastrar y soltar (*drag and drop*).

## Instalación de las dependencias

```bash
# Instala la herramienta de desarrollo
sudo pnpm install -g @angular/cli
# Instala las dependencias
pnpm install
```

Tu necesitas aumenta la memoria de node, para ello se debe modificar la variable de entorno de node (`NODE_OPTIONS`),
para ello debemos asignar al menos 4Gb de memoria `--max_old_space_size=<size>`.

## Desarrollo


| **Commandos**                   | **Descripción**                                         |
|:--------------------------------|:--------------------------------------------------------|
| `pnpm run ng:serve-angular:dev` | Enciende el servidor de angular en modo de desarrollo   |
| `pnpm run ws:server`            | Enciende el servidor websocket, requiere THUMDER Server |

## Despliegue


| **Commandos**                          | **Descripción**                                                                                   |
|:---------------------------------------|:--------------------------------------------------------------------------------------------------|
| `pnpm install`                         | Instala las dependencias del proyecto                                                             |
| `pnpm run postinstall`                 | Inicializa la configuración del proyecto para electro                                             |
| `pnpm run ng:build-angular:production` | Construye la aplicación angular de navegador con las variables de producción                      |
| `pnpm run electron:build`              | Construye la aplicación angular y encapsula la aplicación dentro electron generando un ejecutable |

El despliegue genera las carpetas `/dist`, `/dist-angular` y `/release`.

La carpeta `/dist-angular` es la indicada para el despliegue en servidores.

La carpeta `/release` contiene los ficheros ejecutables con la aplicación.

## Otros comandos


| **Commandos**                          | **Descripción** |
|:---------------------------------------|:----------------|
| `pnpm run ng:build:dev`                |                 |
| `pnpm run ng:build:web`                |                 |
| `pnpm run ng:build:production`         |                 |
| `pnpm run ng:build-angular:dev`        |                 |
| `pnpm run ng:build-angular:web`        |                 |
| `pnpm run ng:build-angular:production` |                 |
| `pnpm run ng:serve:dev`                |                 |
| `pnpm run ng:serve:web`                |                 |
| `pnpm run ng:serve:production`         |                 |
| `pnpm run ng:serve-angular:dev`        |                 |
| `pnpm run ng:serve-angular:web`        |                 |
| `pnpm run ng:serve-angular:production` |                 |

## Server e2e


| **Commandos**           | **Descripción**                                                                 |
|:------------------------|:--------------------------------------------------------------------------------|
| `pnpm run cypress:open` | Abre la aplicación con cypress app y configura los comandos y pruebas           |
| `pnpm run cypress:run`  | Ejecuta las pruebas sobre el servidor (solo son visibles por linea de comandos) |

### Cobertura de navegadores

```bash
pnpm exec browserslist
pnpm exec browserslist --coverage
```

These browsers account for 86.79% of all users globally

## Documentación (Wiki)

La documentación detallada sobre el uso y funcionamiento de la aplicación se encuentra en el directorio `wiki/`:

- [Instalación](wiki/0.Installation.md)
- [Cuenta](wiki/00.Account.md)
- [Ejecución de instrucciones](wiki/00.TheExecutionOfInstructions.md)
- [La ventana de los registros](wiki/01.TheRegisterWindow.md)
- [La memoria](wiki/02.TheMemoryWindow.md)
- [La ventana de código](wiki/03.TheCodeWindow.md)
- [La ventana del diagrama de ciclos de reloj](wiki/04.TheClockCycleDiagramWindow.md)
- [La ventana del cauce de ejecución (Pipeline)](wiki/04.ThePipelineWindow.md)
- [Estadísticas](wiki/05.TheStatisticsWindow.md)
- [Puntos de ruptura (breakpoints)](wiki/06.TheBreakpoints.md)
- [El proceso de simulación](wiki/07.TheExecutionProcess.md)
- [Editar configuración](wiki/08.TheConfiguration.md)
- [Gestor de ficheros](wiki/09.FileManager.md)
- [Editor de ficheros](wiki/10.FileEditor.md)
- [Vista múltiple](wiki/11.Multiview.md)
