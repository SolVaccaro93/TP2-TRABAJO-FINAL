# Fit.js

API REST para gestionar un gimnasio: **socios**, **clases** e **inscripciones** de socios a clases. Está hecha con Node.js y Express, con arquitectura en capas, validación con Zod, persistencia intercambiable (memoria o SQLite) y documentación interactiva con Swagger.

- Arquitectura y diagramas: [docs/arquitectura.md](docs/arquitectura.md)
- Contrato de la API (OpenAPI 3): [openapi.yaml](openapi.yaml)

## Índice

1. [Requisitos](#requisitos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Cómo ejecutarlo](#cómo-ejecutarlo)
5. [Probar la API](#probar-la-api)
6. [Endpoints](#endpoints)
7. [Reglas de negocio](#reglas-de-negocio)
8. [Formato de errores](#formato-de-errores)
9. [Persistencia y datos iniciales](#persistencia-y-datos-iniciales)
10. [Eventos y notificaciones](#eventos-y-notificaciones)
11. [Tests](#tests)
12. [Estructura de carpetas](#estructura-de-carpetas)
13. [Flujo de trabajo del equipo](#flujo-de-trabajo-del-equipo)
14. [Problemas frecuentes](#problemas-frecuentes)

## Requisitos

- **Node.js 20 o superior** (se usan `node --watch`, `node --test` y `await` en el nivel superior de los módulos).
- **npm**, que viene con Node.
- Git, para clonar y trabajar con el repositorio.

## Instalación

```bash
git clone https://github.com/SolVaccaro93/TP2-TRABAJO-FINAL.git
cd TP2-TRABAJO-FINAL
npm install
```

`npm install` descarga todas las dependencias en `node_modules/`. Hay que volver a correrlo **cada vez que un pull modifique `package.json`**; si no, el servidor falla con `ERR_MODULE_NOT_FOUND`.

| Dependencia | Para qué se usa |
| --- | --- |
| `express` | Servidor HTTP y ruteo |
| `zod` | Validación de `params` y `body` |
| `dotenv` | Lee las variables del archivo `.env` |
| `sequelize` + `sqlite3` | Persistencia en SQLite |
| `swagger-ui-express` + `yaml` | Documentación interactiva en `/api-docs` |

## Configuración

La configuración está centralizada en [config/config.js](config/config.js) y se lee de variables de entorno. Todas tienen un valor por defecto, así que **el `.env` es opcional**. Para crearlo, copiá la plantilla:

```bash
cp .env.example .env
```

| Variable | Valores | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `PORT` | número | `3000` | Puerto del servidor |
| `PERSISTENCE_TYPE` | `memory` o `sqlite` | `memory` | Dónde se guardan los datos |
| `DB_STORAGE` | ruta de archivo | `./fitjs.sqlite` | Archivo de la base SQLite (solo en modo `sqlite`) |

El `.env` no se sube al repositorio (está en `.gitignore`); cada integrante tiene el suyo.

## Cómo ejecutarlo

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Desarrollo: reinicia el servidor cada vez que guardás un archivo |
| `npm start` | Ejecuta el servidor una sola vez |
| `npm test` | Corre los tests automáticos |

```bash
npm run dev
```

Cuando arranca muestra:

```
Fit.js escuchando en http://localhost:3000 (persistencia: memory)
```

Para frenarlo: **Ctrl+C** en la terminal.

## Probar la API

### Con Swagger (recomendado)

1. Levantá el servidor con `npm run dev`.
2. Abrí **http://localhost:3000/api-docs** en el navegador.
3. Desplegá una ruta, por ejemplo `POST /socios`.
4. Tocá **Try it out**, completá el body y tocá **Execute**.
5. En **Responses** vas a ver el código HTTP y el JSON devuelto.

### Con el navegador

Sirve solo para las rutas `GET`: `http://localhost:3000/`, `/socios`, `/clases`, `/inscripciones`. La respuesta es JSON, no una página web: el proyecto es una API, no tiene interfaz gráfica.

### Con curl

```bash
curl -X POST http://localhost:3000/socios -H "Content-Type: application/json" -d '{"nombre":"Ana","apellido":"Paz","email":"ana@x.com"}'
```

```bash
curl -X POST http://localhost:3000/clases -H "Content-Type: application/json" -d '{"nombre":"Yoga","cupoMaximo":10}'
```

```bash
curl -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{"socioId":1,"claseId":1}'
```

### Recorrido de ejemplo

1. `POST /socios` → crea el socio (201).
2. `POST /clases` → crea la clase con su `cupoMaximo` (201).
3. `POST /inscripciones` con `socioId` y `claseId` → inscribe al socio (201) y en la consola del servidor aparece `Inscripción 1 creada para el socio 1 en la clase 1`.
4. Repetir el paso 3 → 409 `INSCRIPCION_DUPLICADA`.
5. `GET /inscripciones` → lista las inscripciones.

## Endpoints

Todas las respuestas son JSON. Los `id` van en la URL y tienen que ser enteros positivos.

### General

| Método | Ruta | Respuesta |
| --- | --- | --- |
| `GET` | `/` | 200 — nombre de la API y lista de recursos |
| `GET` | `/api-docs` | Interfaz de Swagger |

### Socios — `/socios`

| Método | Ruta | Body | Éxito | Errores posibles |
| --- | --- | --- | --- | --- |
| `GET` | `/socios` | — | 200 lista | — |
| `GET` | `/socios/:id` | — | 200 socio | 400, 404 `SOCIO_NOT_FOUND` |
| `POST` | `/socios` | `nombre`, `apellido`, `email`, `telefono?`, `activo?` | 201 socio | 400, 409 `EMAIL_DUPLICADO` |
| `PATCH` | `/socios/:id` | al menos un campo | 200 socio | 400, 404, 409 `EMAIL_DUPLICADO` |
| `DELETE` | `/socios/:id` | — | 204 | 400, 404 |

Campos de socio:

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `nombre` | texto | 2 a 50 caracteres |
| `apellido` | texto | 2 a 50 caracteres |
| `email` | texto | email válido; se guarda sin espacios y en minúsculas |
| `telefono` | texto | opcional, hasta 20 caracteres |
| `activo` | booleano | opcional, por defecto `true` al crear |

### Clases — `/clases`

| Método | Ruta | Body | Éxito | Errores posibles |
| --- | --- | --- | --- | --- |
| `GET` | `/clases` | — | 200 lista | — |
| `GET` | `/clases/:id` | — | 200 clase | 400, 404 `CLASE_NOT_FOUND` |
| `POST` | `/clases` | `nombre`, `descripcion?`, `cupoMaximo` | 201 clase | 400 |
| `PATCH` | `/clases/:id` | al menos un campo | 200 clase | 400, 404 |
| `DELETE` | `/clases/:id` | — | 204 | 400, 404 |

Campos de clase:

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `nombre` | texto | 2 a 100 caracteres |
| `descripcion` | texto | opcional, hasta 500 caracteres |
| `cupoMaximo` | número | entero positivo |

### Inscripciones — `/inscripciones`

| Método | Ruta | Body | Éxito | Errores posibles |
| --- | --- | --- | --- | --- |
| `GET` | `/inscripciones` | — | 200 lista | — |
| `GET` | `/inscripciones/:id` | — | 200 inscripción | 400, 404 `INSCRIPCION_NOT_FOUND` |
| `POST` | `/inscripciones` | `socioId`, `claseId` | 201 inscripción | 400, 404 `SOCIO_NOT_FOUND` / `CLASE_NOT_FOUND`, 409 `INSCRIPCION_DUPLICADA` / `CLASE_SIN_CUPO` |
| `DELETE` | `/inscripciones/:id` | — | 204 | 400, 404 |

Las inscripciones no se modifican: si hay que cambiar algo, se borra y se crea otra.

## Reglas de negocio

La forma de los datos la valida Zod en la capa HTTP. Las reglas que dependen de datos guardados viven en los **casos de uso** (`usecases/`):

| Recurso | Regla | Error |
| --- | --- | --- |
| Socio | El email no puede repetirse (al actualizar, un socio puede conservar el suyo) | 409 `EMAIL_DUPLICADO` |
| Socio | Obtener, modificar o borrar un id que no existe | 404 `SOCIO_NOT_FOUND` |
| Clase | Obtener, modificar o borrar un id que no existe | 404 `CLASE_NOT_FOUND` |
| Inscripción | El socio tiene que existir | 404 `SOCIO_NOT_FOUND` |
| Inscripción | La clase tiene que existir | 404 `CLASE_NOT_FOUND` |
| Inscripción | Un socio no puede inscribirse dos veces en la misma clase | 409 `INSCRIPCION_DUPLICADA` |
| Inscripción | La clase no puede superar su `cupoMaximo` | 409 `CLASE_SIN_CUPO` |
| Inscripción | Obtener o borrar un id que no existe | 404 `INSCRIPCION_NOT_FOUND` |

Las validaciones de inscripción se aplican **en ese orden**: existencia, duplicado y cupo.

## Formato de errores

Todos los errores tienen la misma forma, la arma [middlewares/errorHandler.js](middlewares/errorHandler.js):

```json
{
  "error": {
    "code": "EMAIL_DUPLICADO",
    "message": "Ya existe un socio con el email ana@x.com",
    "details": null
  }
}
```

| Status | `code` | Cuándo |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Datos inválidos; `details` lista cada campo con su problema |
| 400 | `INVALID_JSON` | El body no es un JSON válido |
| 404 | `ROUTE_NOT_FOUND` | La ruta no existe |
| 404 | `*_NOT_FOUND` | El registro pedido no existe |
| 409 | `EMAIL_DUPLICADO`, `INSCRIPCION_DUPLICADA`, `CLASE_SIN_CUPO` | Conflicto con una regla de negocio |
| 500 | `INTERNAL_ERROR` | Error no previsto; el detalle se imprime en la consola, no se envía al cliente |

Ejemplo de 400 con detalle:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Datos inválidos en body",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

## Persistencia y datos iniciales

El tipo de persistencia se elige con `PERSISTENCE_TYPE` y lo resuelve [dao/dao.factory.js](dao/dao.factory.js). Los casos de uso no cambian: los dos modos implementan los mismos métodos.

| | `memory` (por defecto) | `sqlite` |
| --- | --- | --- |
| Dónde se guarda | Arrays en memoria | Archivo `fitjs.sqlite` (Sequelize) |
| Al reiniciar | Se pierde todo y arranca vacío | Los datos se conservan |
| Datos iniciales | No | Sí, con [dao/seed.js](dao/seed.js) |
| Borrar un socio o una clase | Las inscripciones relacionadas quedan guardadas | Se borran en cascada |

Con `npm run dev` el servidor se reinicia al guardar cualquier archivo, así que en modo `memory` los datos se pierden seguido. Para conservarlos, usá SQLite:

```
PERSISTENCE_TYPE=sqlite
```

### Datos iniciales (seed)

En modo `sqlite`, al arrancar se cargan datos de ejemplo **solo en las tablas que estén vacías**, así reiniciar no duplica nada:

- **Socios:** Ana Pérez, Luis Gómez y Marta Rossi (inactiva).
- **Clases:** Spinning (cupo 2), Yoga (cupo 15) y Funcional (cupo 10).
- **Inscripciones:** Ana y Luis en Spinning (queda con el cupo lleno) y Ana en Yoga.

Para cambiarlos, editá las listas de `dao/seed.js`. Para volver a empezar de cero, frená el servidor y borrá el archivo `fitjs.sqlite`.

## Eventos y notificaciones

El contenedor crea un único bus de eventos (`EventEmitter`) compartido por los casos de uso.

1. Al crear una inscripción, el caso de uso emite `inscripcion.creada` con la inscripción guardada.
2. [listeners/inscripcion.listener.js](listeners/inscripcion.listener.js) escucha ese evento y llama al notificador.
3. [notifiers/console.notifier.js](notifiers/console.notifier.js) imprime en la consola del servidor:

```
Inscripción 3 creada para el socio 1 en la clase 2
```

Si el notificador falla, el listener registra el error y la inscripción igual se crea. Para notificar por otro medio (mail, archivo) se agrega otro notificador con el método `notificarInscripcionCreada` y se cambia en el contenedor.

## Tests

```bash
npm test
```

Usa el runner nativo de Node (`node --test`), sin dependencias extra. Cada test levanta la app en un puerto libre y le hace requests HTTP reales.

| Archivo | Qué prueba |
| --- | --- |
| `tests/clase.test.js` | CRUD de clases y validaciones HTTP |
| `tests/inscripcion.test.js` | Existencia, duplicados y cupo; emisión de `inscripcion.creada`; listener y manejo de errores del notificador |
| `tests/persistencia.test.js` | Que memoria y SQLite respondan igual al mismo escenario; error claro con un `PERSISTENCE_TYPE` inválido |

Los tests de SQLite usan una base en memoria (`:memory:`), así que no tocan `fitjs.sqlite`.

## Estructura de carpetas

```
TP2-TRABAJO-FINAL/
├── index.js                 Arranque: middlewares, Swagger, contenedor, listen
├── openapi.yaml             Contrato de la API (lo muestra Swagger)
├── config/config.js         Configuración desde variables de entorno
├── container/container.js   Arma y conecta todas las capas (inyección de dependencias)
├── routes/                  URL + verbo → validación → controller
├── middlewares/             validate, notFound, errorHandler
├── schemas/                 Esquemas Zod de cada recurso
├── controllers/             Traducen HTTP ↔ casos de uso y eligen el status
├── usecases/                Reglas de negocio
├── dao/
│   ├── dao.factory.js       Elige memoria o SQLite
│   ├── memory/              DAOs en memoria
│   ├── sqlite/              DAOs con Sequelize
│   ├── models/              Modelos y relaciones de Sequelize
│   └── seed.js              Datos iniciales para SQLite
├── errors/AppError.js       Errores de dominio con code y status
├── listeners/               Reaccionan a eventos del bus
├── notifiers/               Envían las notificaciones
├── tests/                   Tests de integración
└── docs/arquitectura.md     Arquitectura y diagramas
```

### Cómo agregar un recurso nuevo

Siguiendo el mismo patrón que Socio, Clase e Inscripción:

1. `schemas/<recurso>.schema.js` con los esquemas de crear y actualizar.
2. DAOs en `dao/memory/` y `dao/sqlite/` (y su modelo en `dao/models/index.js`) con los mismos métodos.
3. Registrarlos en `dao/dao.factory.js` y en `makeMemoryDaos` del contenedor.
4. `usecases/<recurso>.usecases.js` con las reglas de negocio y sus `AppError`.
5. `controllers/<recurso>.controller.js` y `routes/<recurso>.routes.js`.
6. Conectarlos en `container/container.js` y sumarlos a la lista de `GET /`.
7. Documentar las rutas en `openapi.yaml` y agregar tests en `tests/`.

## Flujo de trabajo del equipo

1. Antes de empezar: `git pull` y, si cambió `package.json`, `npm install`.
2. Hacer el cambio y probarlo con `npm run dev` y Swagger.
3. Correr `npm test` antes de commitear.
4. Commits cortos con prefijo según el tipo de cambio:

| Prefijo | Uso | Ejemplo del repo |
| --- | --- | --- |
| `feat:` | Funcionalidad nueva | `feat: agrega casos de uso de Socio` |
| `fix:` | Corrección de un error | `fix: Corregir trim del email y defaults en el update` |
| `refactor:` | Cambio interno sin cambiar el comportamiento | `refactor: renombra AppErrors.js a AppError.js` |
| `test:` | Tests | `test: agrega pruebas de integración para inscripciones` |
| `chore:` | Configuración y dependencias | `chore: agrega dependencias base (express, zod, dotenv)` |
| `docs:` | Documentación | — |

5. `git push` o abrir un PR, y avisar al equipo si se agregaron dependencias o variables de entorno.

## Problemas frecuentes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `ERR_MODULE_NOT_FOUND: Cannot find package '...'` | Un pull agregó dependencias | `npm install` |
| `EADDRINUSE: address already in use :::3000` | Ya hay otro servidor en ese puerto | Cerrar la otra terminal con Ctrl+C o cambiar `PORT` en `.env` |
| `GET /socios` devuelve `[]` | Modo `memory`: arranca vacío y se borra al reiniciar | Crear datos con POST o usar `PERSISTENCE_TYPE=sqlite` |
| `404 ROUTE_NOT_FOUND` | La URL o el método no existen | Revisar la ruta en Swagger |
| `400 INVALID_JSON` | El body no es JSON válido | Revisar comillas y comas, y enviar `Content-Type: application/json` |
| `PERSISTENCE_TYPE inválido` al arrancar | Valor distinto de `memory` o `sqlite` | Corregir el `.env` |
| Los datos de SQLite no son los esperados | El seed solo carga tablas vacías | Frenar el servidor y borrar `fitjs.sqlite` |
