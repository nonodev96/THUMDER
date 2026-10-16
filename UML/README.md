# Diagramas UML

Son los diagramas de diseño de la primera versión de THUMDER (2022): proyecto, casos de uso, secuencias, modelo, clases y actividades, en PlantUML. Se conservan como documentación histórica, pero **ya no describen el código actual**:

- La simulación ya no está en THUMDER-server (Socket.IO): la hacen el ensamblador y el pipeline de `src/app/__core/engine`, en un Web Worker. El protocolo está en [docs/simulador.md](../docs/simulador.md).
- `MachineService` ya no tiene `Subject` ni crea objetos de PixiJS: guarda el estado en *signals* (`state`) y el diagrama de ciclos es un modelo de datos (`CycleDiagramModel`).
- Los ficheros están en el navegador (IndexedDB) y, con cuenta, también en Firestore (`FileSystemStorageService`).
- Ya no hay módulos de Angular: todo son componentes independientes con rutas que se cargan bajo demanda.

Para generar diagramas de clases del código de hoy: `scripts/_1_generate_uml.sh` (necesita [tplant](https://github.com/bafolts/tplant)).
