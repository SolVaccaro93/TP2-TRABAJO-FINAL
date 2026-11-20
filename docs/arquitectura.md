# Arquitectura de Fit.js

Fit.js es una API REST en capas para gestionar un gimnasio. Cada request atraviesa las capas de arriba hacia abajo y cada capa tiene una sola responsabilidad. Están implementados **Socio**, **Clase** e **Inscripción**, con persistencia intercambiable (memoria o SQLite), un bus de eventos para notificaciones y documentación interactiva con Swagger.

Para instalar, ejecutar y probar el proyecto, ver el [README](../README.md). Versión visual: [tablero en Miro](https://miro.com/app/board/uXjVERWaj4Y=/).

## Índice

1. [Vista general](#vista-general)
2. [Arranque del servidor](#arranque-del-servidor)
3. [Cómo se arma el contenedor](#cómo-se-arma-el-contenedor)
4. [Flujo de una request](#flujo-de-una-request)
5. [Crear una inscripción paso a paso](#crear-una-inscripción-paso-a-paso)
6. [Reglas de inscripción](#reglas-de-inscripción)
7. [Modelo de datos](#modelo-de-datos)
8. [Persistencia intercambiable](#persistencia-intercambiable)
9. [Eventos y notificaciones](#eventos-y-notificaciones)
10. [Manejo de errores](#manejo-de-errores)
11. [Qué es cada pieza](#qué-es-cada-pieza)
12. [Decisiones de diseño](#decisiones-de-diseño)

## Vista general

Las flechas indican quién llama a quién. Ninguna capa conoce a las que están por encima: los casos de uso no saben de HTTP y los DAOs no saben de reglas de negocio.

```mermaid
flowchart TD
    cliente["Cliente<br/>Swagger, navegador, curl o tests"]

    subgraph http["Capa HTTP"]
        index["index.js<br/>express.json, Swagger, notFound, errorHandler"]
        routes["routes/<br/>verbo + URL"]
        validate["middlewares/validate.js<br/>Zod: params y body"]
        controllers["controllers/<br/>req a caso de uso y status"]
    end

    subgraph negocio["Capa de negocio"]
        usecases["usecases/<br/>reglas de negocio"]
        bus(("EventEmitter<br/>bus de eventos"))
        listener["listeners/<br/>inscripcion.listener.js"]
        notifier["notifiers/<br/>console.notifier.js"]
    end

    subgraph datos["Capa de datos"]
        factory["dao/dao.factory.js<br/>elige memoria o SQLite"]
        memory["dao/memory/<br/>arrays en memoria"]
        sqlite["dao/sqlite/ + dao/models/<br/>Sequelize"]
        db[("fitjs.sqlite")]
    end

    errores["errors/AppError.js<br/>+ middlewares/errorHandler.js"]

    cliente --> index --> routes --> validate --> controllers --> usecases
    usecases --> memory
    usecases --> sqlite --> db
    factory -. "crea" .-> memory
    factory -. "crea" .-> sqlite
    usecases -- "inscripcion.creada" --> bus --> listener --> notifier
    validate -- "400" --> errores
    usecases -- "404 / 409" --> errores
    errores -. "JSON de error" .-> cliente
    controllers -. "200 / 201 / 204" .-> cliente
```

## Arranque del servidor

Qué pasa cuando se ejecuta `npm run dev` o `npm start`:

```mermaid
flowchart TD
    inicio(["npm run dev / npm start"]) --> config["config/config.js<br/>lee .env: PORT, PERSISTENCE_TYPE, DB_STORAGE"]
    config --> express["index.js crea la app<br/>express.json()"]
    express --> swagger["Lee openapi.yaml<br/>monta Swagger en /api-docs"]
    swagger --> factory{"makeDaos(PERSISTENCE_TYPE)"}
    factory -- "memory" --> mem["DAOs en memoria<br/>arrancan vacíos"]
    factory -- "sqlite" --> initdb["Importa Sequelize y los modelos<br/>initDb(): crea las tablas si no existen"]
    factory -- "otro valor" --> error(["Error: PERSISTENCE_TYPE inválido<br/>el servidor no arranca"])
    initdb --> sqlitedaos["DAOs SQLite"]
    sqlitedaos --> seed["seed(daos)<br/>carga datos de ejemplo en tablas vacías"]
    mem --> container
    seed --> container["makeContainer({ daos })<br/>bus de eventos, listener, casos de uso,<br/>controllers y routers"]
    container --> montar["app.use(router)<br/>/, /socios, /clases, /inscripciones"]
    montar --> finales["app.use(notFound)<br/>app.use(errorHandler)"]
    finales --> listen(["app.listen(PORT)<br/>Fit.js escuchando en http://localhost:3000"])
```

El orden en `index.js` importa: `notFound` y `errorHandler` van **al final** para atrapar lo que ninguna ruta atendió y cualquier error lanzado antes.

## Cómo se arma el contenedor

`container/container.js` conecta las capas en sentido inverso al de la request: crea primero lo de abajo y se lo pasa a la capa de arriba (inyección de dependencias manual). Recibe los DAOs ya creados por `makeDaos()`; si se llama sin argumentos, usa DAOs en memoria (así lo usan los tests).

```mermaid
flowchart LR
    subgraph daos["DAOs (de makeDaos)"]
        socioDao["socioDao"]
        claseDao["claseDao"]
        inscripcionDao["inscripcionDao"]
    end

    eventBus(("eventBus"))
    notifier["makeConsoleNotifier()"]
    listener["registerInscripcionListener"]

    socioUC["makeSocioUseCases"]
    claseUC["makeClaseUseCases"]
    inscUC["makeInscripcionUseCases"]

    socioCtrl["makeSocioController"]
    claseCtrl["makeClaseController"]
    inscCtrl["makeInscripcionController"]

    socioR["makeSocioRouter"]
    claseR["makeClaseRouter"]
    inscR["makeInscripcionRouter"]

    router["Router principal<br/>GET /<br/>/socios, /clases, /inscripciones"]

    eventBus --> listener
    notifier --> listener

    socioDao --> socioUC
    claseDao --> claseUC
    inscripcionDao --> inscUC
    socioDao -- "valida existencia" --> inscUC
    claseDao -- "valida existencia y cupo" --> inscUC
    eventBus --> socioUC
    eventBus --> claseUC
    eventBus --> inscUC

    socioUC --> socioCtrl --> socioR --> router
    claseUC --> claseCtrl --> claseR --> router
    inscUC --> inscCtrl --> inscR --> router
```

Inscripción es el único caso de uso que recibe DAOs de otros recursos, porque necesita consultar socios y clases para aplicar sus reglas.

## Flujo de una request

Ejemplo con `POST /socios`. Clase e Inscripción siguen el mismo recorrido con sus propios archivos.

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant I as index.js
    participant R as socio.routes.js
    participant V as validate.js
    participant Ct as socio.controller.js
    participant U as socio.usecases.js
    participant D as socioDao
    participant E as errorHandler.js

    C->>I: POST /socios {"nombre","apellido","email"}
    I->>I: express.json() parsea el body
    alt JSON mal formado
        I->>E: error entity.parse.failed
        E-->>C: 400 INVALID_JSON
    end
    I->>R: router del contenedor
    R->>V: validate({ body: crearSocioSchema })
    alt datos inválidos
        V->>E: AppError.badRequest(details)
        E-->>C: 400 BAD_REQUEST con details por campo
    end
    V->>V: normaliza (trim, email en minúsculas, activo=true)
    V->>Ct: req.body limpio
    Ct->>U: crear(req.body)
    U->>D: getByEmail(email)
    D-->>U: socio o null
    alt el email ya existe
        U->>E: AppError.conflict EMAIL_DUPLICADO
        E-->>C: 409 EMAIL_DUPLICADO
    end
    U->>D: create(data)
    D-->>U: socio con id
    U-->>Ct: socio
    Ct-->>C: 201 Created + socio
```

## Crear una inscripción paso a paso

Es el flujo más completo: valida contra tres DAOs, aplica tres reglas y dispara un evento.

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant V as validate.js
    participant U as inscripcion.usecases.js
    participant SD as socioDao
    participant CD as claseDao
    participant ID as inscripcionDao
    participant B as eventBus
    participant L as inscripcion.listener.js
    participant N as console.notifier.js

    C->>V: POST /inscripciones {"socioId":1,"claseId":2}
    V->>V: socioId y claseId enteros positivos
    V->>U: crear({ socioId, claseId })

    U->>SD: getById(socioId)
    SD-->>U: socio o null
    Note over U: null: 404 SOCIO_NOT_FOUND

    U->>CD: getById(claseId)
    CD-->>U: clase o null
    Note over U: null: 404 CLASE_NOT_FOUND

    U->>ID: getBySocioAndClase(socioId, claseId)
    ID-->>U: inscripción o null
    Note over U: existe: 409 INSCRIPCION_DUPLICADA

    U->>ID: countByClase(claseId)
    ID-->>U: cantidad de inscriptos
    Note over U: inscriptos >= cupoMaximo: 409 CLASE_SIN_CUPO

    U->>ID: create({ socioId, claseId })
    ID-->>U: inscripción con id
    U->>B: emit("inscripcion.creada", inscripcion)
    B->>L: onInscripcionCreada(inscripcion)
    L->>N: notificarInscripcionCreada(inscripcion)
    N-->>N: console.log("Inscripción 3 creada para el socio 1 en la clase 2")
    U-->>C: 201 Created + inscripción
```

## Reglas de inscripción

Las reglas se evalúan en este orden; la primera que falla corta el flujo.

```mermaid
flowchart TD
    inicio(["POST /inscripciones"]) --> forma{"¿socioId y claseId<br/>son enteros positivos?"}
    forma -- "no" --> e400["400 BAD_REQUEST"]
    forma -- "sí" --> socio{"¿Existe el socio?"}
    socio -- "no" --> e404s["404 SOCIO_NOT_FOUND"]
    socio -- "sí" --> clase{"¿Existe la clase?"}
    clase -- "no" --> e404c["404 CLASE_NOT_FOUND"]
    clase -- "sí" --> dup{"¿El socio ya está<br/>inscripto en esa clase?"}
    dup -- "sí" --> e409d["409 INSCRIPCION_DUPLICADA"]
    dup -- "no" --> cupo{"¿Inscriptos < cupoMaximo?"}
    cupo -- "no" --> e409c["409 CLASE_SIN_CUPO"]
    cupo -- "sí" --> crear["Guarda la inscripción"]
    crear --> evento["Emite inscripcion.creada"]
    evento --> ok(["201 Created"])
```

Reglas de los otros recursos:

| Recurso | Regla | Error |
| --- | --- | --- |
| Socio | Email único al crear y al actualizar (puede conservar el suyo) | 409 `EMAIL_DUPLICADO` |
| Socio | El id tiene que existir para obtener, modificar o borrar | 404 `SOCIO_NOT_FOUND` |
| Clase | El id tiene que existir para obtener, modificar o borrar | 404 `CLASE_NOT_FOUND` |
| Inscripción | El id tiene que existir para obtener o borrar | 404 `INSCRIPCION_NOT_FOUND` |

## Modelo de datos

Un socio puede tener muchas inscripciones y una clase puede tener muchas inscripciones. La inscripción es la tabla intermedia entre ambos.

```mermaid
erDiagram
    SOCIO ||--o{ INSCRIPCION : "se inscribe"
    CLASE ||--o{ INSCRIPCION : "recibe"

    SOCIO {
        int id PK
        string nombre "2 a 50 caracteres"
        string apellido "2 a 50 caracteres"
        string email UK "único, en minúsculas"
        string telefono "opcional, hasta 20"
        boolean activo "por defecto true"
    }

    CLASE {
        int id PK
        string nombre "2 a 100 caracteres"
        string descripcion "opcional, hasta 500"
        int cupoMaximo "entero positivo"
    }

    INSCRIPCION {
        int id PK
        int socioId FK
        int claseId FK
    }
```

En SQLite las relaciones están definidas en `dao/models/index.js` con `onDelete: 'CASCADE'`: al borrar un socio o una clase se borran sus inscripciones. En memoria no hay cascada.

## Persistencia intercambiable

Los casos de uso dependen de un **contrato** (los métodos del DAO), no de una implementación. `dao/dao.factory.js` elige cuál crear según `PERSISTENCE_TYPE`.

```mermaid
flowchart LR
    env[".env<br/>PERSISTENCE_TYPE"] --> factory{"dao.factory.js<br/>makeDaos()"}

    factory -- "memory" --> m1["SocioMemoryDao"]
    factory -- "memory" --> m2["ClaseMemoryDao"]
    factory -- "memory" --> m3["InscripcionMemoryDao"]
    m1 & m2 & m3 --> arrays[("Arrays en memoria<br/>se pierden al reiniciar")]

    factory -- "sqlite" --> s1["SocioSqliteDao"]
    factory -- "sqlite" --> s2["ClaseSqliteDao"]
    factory -- "sqlite" --> s3["InscripcionSqliteDao"]
    s1 & s2 & s3 --> models["dao/models/index.js<br/>Sequelize"] --> file[("fitjs.sqlite<br/>persiste")]

    m1 & m2 & m3 & s1 & s2 & s3 -.-> contrato["Mismo contrato<br/>que usan los casos de uso"]
```

| Método | Socio | Clase | Inscripción | Devuelve |
| --- | :-: | :-: | :-: | --- |
| `getAll()` | ✔ | ✔ | ✔ | Lista |
| `getById(id)` | ✔ | ✔ | ✔ | Registro o `null` |
| `getByEmail(email)` | ✔ | | | Registro o `null` |
| `getBySocioAndClase(socioId, claseId)` | | | ✔ | Registro o `null` |
| `countByClase(claseId)` | | | ✔ | Número |
| `create(data)` | ✔ | ✔ | ✔ | Registro con `id` |
| `update(id, data)` | ✔ | ✔ | | Registro o `null` |
| `delete(id)` | ✔ | ✔ | ✔ | `true` o `false` |

Los dos modos devuelven objetos planos y sin campos `null`, para que las respuestas sean iguales. `tests/persistencia.test.js` corre el mismo escenario en ambos y verifica que respondan idéntico.

Con SQLite, `dao/seed.js` carga datos de ejemplo al arrancar, solo en las tablas que estén vacías.

## Eventos y notificaciones

El contenedor crea **un único** `EventEmitter` y lo comparte con todos los casos de uso. Hoy se usa un evento:

```mermaid
flowchart LR
    uc["inscripcion.usecases.js<br/>crear()"] -- "emit inscripcion.creada<br/>(inscripción guardada)" --> bus(("eventBus"))
    bus --> listener["inscripcion.listener.js<br/>try / catch"]
    listener -- "notificarInscripcionCreada" --> notifier["console.notifier.js"]
    notifier --> consola[/"Consola del servidor"/]
    listener -. "si el notificador falla:<br/>logger.error, la inscripción<br/>igual se crea" .-> log[/"console.error"/]
```

- El caso de uso no sabe quién escucha: solo emite el evento después de guardar.
- El listener aísla los errores del notificador para que no rompan la request.
- `registerInscripcionListener` devuelve una función para desuscribirse (la usan los tests).
- Para notificar por otro medio se crea otro notificador con `notificarInscripcionCreada` y se cambia en el contenedor.

## Manejo de errores

Todos los errores terminan en `middlewares/errorHandler.js`, que responde siempre `{ error: { code, message, details } }`.

```mermaid
flowchart TD
    origen["Error en cualquier capa"] --> tipo{"¿Qué tipo de error es?"}
    tipo -- "instanceof AppError" --> app["status y code del AppError<br/>400, 404 o 409"]
    tipo -- "entity.parse.failed<br/>(lo lanza express.json)" --> json["400 INVALID_JSON"]
    tipo -- "cualquier otro" --> bug["console.error(err)<br/>500 INTERNAL_ERROR<br/>sin detalles internos"]
    app & json & bug --> resp["{ error: { code, message, details } }"]
```

| Quién lo genera | Error |
| --- | --- |
| `express.json()` | 400 `INVALID_JSON` |
| `middlewares/validate.js` | 400 `BAD_REQUEST` con `details` por campo |
| `middlewares/notFound.js` | 404 `ROUTE_NOT_FOUND` |
| `usecases/` | 404 `*_NOT_FOUND`, 409 `EMAIL_DUPLICADO`, `INSCRIPCION_DUPLICADA`, `CLASE_SIN_CUPO` |
| Cualquier error no previsto | 500 `INTERNAL_ERROR` |

`AppError` tiene fábricas para los casos comunes: `AppError.badRequest(message, details)`, `AppError.notFound(message, code)` y `AppError.conflict(message, code)`. Express 5 pasa automáticamente al `errorHandler` los errores de los controllers `async`, por eso los controllers no necesitan `try/catch`.

## Qué es cada pieza

| Pieza | Qué hace | Qué no hace |
| --- | --- | --- |
| `index.js` | Arranca el servidor, monta Swagger, elige los DAOs, corre el seed y fija el orden de los middlewares | No contiene lógica de negocio |
| `config/config.js` | Junta en un solo lugar el puerto, el tipo de persistencia y el archivo de SQLite | No valida reglas |
| `container/container.js` | Crea y conecta DAOs, bus de eventos, casos de uso, controllers y routers; define `GET /` | No atiende requests de recursos |
| `routes/` | Une cada verbo y URL con su validación y su controller | No tiene lógica |
| `schemas/` | Define con Zod qué campos llegan y con qué formato | No consulta datos guardados |
| `middlewares/validate.js` | Revisa `params`, `query` y `body` y deja en `req` los datos limpios | No consulta datos guardados |
| `controllers/` | Toma los datos de `req`, llama al caso de uso y elige el status | No conoce el DAO |
| `usecases/` | Aplica las reglas de negocio y emite eventos | No conoce HTTP ni dónde se guardan los datos |
| `dao/dao.factory.js` | Crea los DAOs de memoria o de SQLite | No conoce las reglas |
| `dao/memory/`, `dao/sqlite/` | Leen y escriben datos; si no encuentran algo devuelven `null` | No deciden errores de negocio |
| `dao/models/index.js` | Conexión, modelos y relaciones de Sequelize | No se carga en modo memoria |
| `dao/seed.js` | Datos de ejemplo para SQLite | No pisa datos existentes |
| `listeners/` | Reaccionan a eventos del bus | No modifican datos |
| `notifiers/` | Envían la notificación (hoy, por consola) | No conocen el bus |
| `errors/AppError.js` | Representa un error conocido con `code`, `message`, `statusCode` y `details` | No arma la respuesta HTTP |
| `middlewares/notFound.js` | Genera el 404 `ROUTE_NOT_FOUND` | No atiende rutas existentes |
| `middlewares/errorHandler.js` | Responde todos los errores con el mismo formato | No muestra detalles internos en un 500 |
| `openapi.yaml` | Contrato de la API que muestra Swagger en `/api-docs` | No valida requests |
| `tests/` | Tests de integración con requests HTTP reales | No usan `fitjs.sqlite` |

## Decisiones de diseño

- **Capas con una sola responsabilidad.** Cambiar cómo se guardan los datos no toca las reglas, y cambiar una regla no toca HTTP.
- **Inyección de dependencias manual.** Cada fábrica (`make...`) recibe lo que necesita. Eso permite que los tests armen la app con los DAOs que quieran.
- **Zod valida la forma, los casos de uso validan el negocio.** Que un email tenga formato válido es de Zod; que no esté repetido depende de los datos guardados y va en el caso de uso.
- **Los DAOs devuelven `null`, los casos de uso deciden el error.** Así un "no encontrado" se traduce siempre al mismo `AppError` con el mismo `code`.
- **SQLite se importa solo si se usa.** `dao.factory.js` lo carga con `import()` dinámico para que el modo memoria no dependa de Sequelize.
- **Eventos desacoplados.** Agregar notificaciones nuevas no requiere modificar el caso de uso de inscripción.
- **Un único `makeContainer()`.** Cada llamada crea DAOs en memoria nuevos y vacíos, por eso `index.js` lo llama una sola vez.
