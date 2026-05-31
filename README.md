THUMDER
=======

<p align="center">
  <img src="./assets/favicon.256x256.png" alt="ICON" width="256px" height="256px"/>
</p>

Página del proyecto en producción <a href="https://thumder.netlify.com">THUMDER</a>

Repositorio del servidor del proyecto <a href="https://github.com/nonodev96/THUMDER-server">THUMDER server</a>

## ¿Qué es THUMDER?

**THUMDER** es un simulador visual interactivo y entorno de desarrollo (IDE) diseñado para la arquitectura del repertorio de instrucciones **DLX**. Su objetivo principal es facilitar el estudio y la comprensión del funcionamiento interno de un procesador segmentado, permitiendo a estudiantes y desarrolladores observar en tiempo real cómo se ejecutan las instrucciones y cómo interactúan los distintos componentes de la arquitectura.

Desarrollado sobre tecnologías web modernas (**Angular** y **Electron**), THUMDER ofrece una interfaz gráfica multiplataforma (Windows, Linux, macOS) que se apoya en un motor de simulación gestionado por [THUMDER Server](https://github.com/nonodev96/THUMDER-server).

### Características Principales

- **Editor Integrado y Gestor de Ficheros:** Escribe y administra tu propio código ensamblador DLX directamente en la aplicación, definiendo puntos de ruptura (*breakpoints*) para facilitar la depuración.
- **Simulación Precisa:** Ejecuta programas paso a paso (instrucción a instrucción) o visualiza los cambios detallados ciclo a ciclo de reloj.
- **Visualización del Cauce (Pipeline):** Sigue el recorrido de cada instrucción a través de las 5 etapas clásicas del procesador DLX 
  - **Fetch** (Búsqueda)
  - **Decode** (Decodificación)
  - **Execute** (Ejecución)
  - **Memory-Access** (Acceso a memoria)
  - **Write-Result** (Escritura de resultados)
- **Control de Memoria y Registros:** Inspecciona y modifica el valor de los registros del procesador y de la memoria principal de forma dinámica durante la simulación.
- **Diagrama de Ciclos de Reloj:** Analiza gráficamente la superposición de instrucciones y comprende cómo la arquitectura resuelve los adelantamientos (*forwarding*) y los riesgos estructurales, de datos y de control.
- **Análisis Estadístico:** Obtén métricas y estadísticas detalladas de rendimiento al realizar las simulaciones.
- **Interfaz Múltiple Personalizable:** Un entorno modular (*Multiview*) que permite reorganizar las diferentes vistas (código, pipeline, memoria, diagramas) mediante un sistema flexible de arrastrar y soltar (*drag and drop*).

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

```bash
pnpm cypress install
```

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
