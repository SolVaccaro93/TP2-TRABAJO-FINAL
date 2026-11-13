import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import express from 'express';
import { makeContainer } from '../container/container.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import { ClaseMemoryDao } from '../dao/memory/clase.memory.dao.js';
import { InscripcionMemoryDao } from '../dao/memory/inscripcion.memory.dao.js';
import { SocioMemoryDao } from '../dao/memory/socio.memory.dao.js';
import { makeInscripcionUseCases } from '../usecases/inscripcion.usecases.js';
import { registerInscripcionListener } from '../listeners/inscripcion.listener.js';
import { makeConsoleNotifier } from '../notifiers/console.notifier.js';

test('Inscripciones valida existencia, duplicados y cupo', async (t) => {
  const app = express();
  app.use(express.json());
  app.use(makeContainer());
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (resource, method = 'GET', body) => fetch(`${base}/${resource}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const crearSocio = async (nombre, email) => {
    const response = await request('socios', 'POST', {
      nombre,
      apellido: 'Prueba',
      email,
    });
    assert.equal(response.status, 201);
    return response.json();
  };

  const socio = await crearSocio('Ana', 'ana@example.com');
  const claseResponse = await request('clases', 'POST', {
    nombre: 'Yoga',
    cupoMaximo: 1,
  });
  assert.equal(claseResponse.status, 201);
  const clase = await claseResponse.json();

  const socioInexistente = await request('inscripciones', 'POST', {
    socioId: 999,
    claseId: clase.id,
  });
  assert.equal(socioInexistente.status, 404);
  assert.equal((await socioInexistente.json()).error.code, 'SOCIO_NOT_FOUND');

  const claseInexistente = await request('inscripciones', 'POST', {
    socioId: socio.id,
    claseId: 999,
  });
  assert.equal(claseInexistente.status, 404);
  assert.equal((await claseInexistente.json()).error.code, 'CLASE_NOT_FOUND');

  const created = await request('inscripciones', 'POST', {
    socioId: socio.id,
    claseId: clase.id,
  });
  assert.equal(created.status, 201);
  const inscripcion = await created.json();
  assert.deepEqual(inscripcion, { id: 1, socioId: socio.id, claseId: clase.id });

  const duplicada = await request('inscripciones', 'POST', {
    socioId: socio.id,
    claseId: clase.id,
  });
  assert.equal(duplicada.status, 409);
  assert.equal((await duplicada.json()).error.code, 'INSCRIPCION_DUPLICADA');

  const otroSocio = await crearSocio('Luis', 'luis@example.com');
  const sinCupo = await request('inscripciones', 'POST', {
    socioId: otroSocio.id,
    claseId: clase.id,
  });
  assert.equal(sinCupo.status, 409);
  assert.equal((await sinCupo.json()).error.code, 'CLASE_SIN_CUPO');
});

test('crear una inscripción emite inscripcion.creada con la inscripción guardada', async () => {
  const socioDao = new SocioMemoryDao();
  const claseDao = new ClaseMemoryDao();
  const inscripcionDao = new InscripcionMemoryDao();
  const socio = await socioDao.create({ nombre: 'Ana' });
  const clase = await claseDao.create({ nombre: 'Yoga', cupoMaximo: 1 });
  const eventBus = new EventEmitter();
  const inscripcionUseCases = makeInscripcionUseCases({
    inscripcionDao,
    socioDao,
    claseDao,
    eventBus,
  });
  let emittedInscripcion;
  eventBus.once('inscripcion.creada', (inscripcion) => {
    emittedInscripcion = inscripcion;
  });

  const created = await inscripcionUseCases.crear({ socioId: socio.id, claseId: clase.id });

  assert.deepEqual(emittedInscripcion, created);
  assert.deepEqual(await inscripcionDao.getById(created.id), created);
});

test('el listener deriva inscripcion.creada al notificador de consola', () => {
  const eventBus = new EventEmitter();
  const messages = [];
  const notifier = makeConsoleNotifier({
    logger: { log: (message) => messages.push(message) },
  });
  registerInscripcionListener({
    eventBus,
    notifier,
    logger: { error: assert.fail },
  });

  eventBus.emit('inscripcion.creada', { id: 3, socioId: 5, claseId: 8 });

  assert.deepEqual(messages, [
    'Inscripción 3 creada para el socio 5 en la clase 8',
  ]);
});

test('el listener captura y registra los errores del notificador', () => {
  const eventBus = new EventEmitter();
  const notifierError = new Error('Fallo al notificar');
  const capturedErrors = [];
  registerInscripcionListener({
    eventBus,
    notifier: {
      notificarInscripcionCreada() {
        throw notifierError;
      },
    },
    logger: {
      error: (message, error) => capturedErrors.push({ message, error }),
    },
  });

  assert.doesNotThrow(() => eventBus.emit('inscripcion.creada', { id: 3 }));
  assert.deepEqual(capturedErrors, [{
    message: 'Error en el listener inscripcion.creada:',
    error: notifierError,
  }]);
});
