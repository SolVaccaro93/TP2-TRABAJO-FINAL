import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { makeContainer } from '../container/container.js';
import { errorHandler } from '../middlewares/errorHandler.js';

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
