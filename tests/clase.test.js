import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { makeContainer } from '../container/container.js';
import { errorHandler } from '../middlewares/errorHandler.js';

test('CRUD de Clase y validaciones HTTP', async (t) => {
  const app = express();
  app.use(express.json());
  app.use(makeContainer());
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/clases`;
  const request = (path = '', method = 'GET', body) => fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  for (const cupoMaximo of [undefined, 0, -1, 1.5, '10']) {
    const response = await request('', 'POST', { nombre: 'Yoga', cupoMaximo });
    assert.equal(response.status, 400);
  }
  assert.equal((await request('', 'POST', { nombre: ' ', cupoMaximo: 10 })).status, 400);

  const created = await request('', 'POST', { nombre: ' Yoga ', cupoMaximo: 10 });
  assert.equal(created.status, 201);
  const clase = await created.json();
  assert.deepEqual(clase, { id: 1, nombre: 'Yoga', cupoMaximo: 10 });
  assert.deepEqual(await (await request()).json(), [clase]);
  assert.deepEqual(await (await request('/1')).json(), clase);

  for (const body of [{}, { desconocido: true }, { cupoMaximo: 0 }]) {
    assert.equal((await request('/1', 'PATCH', body)).status, 400);
  }
  const updated = await request('/1', 'PATCH', { cupoMaximo: 20 });
  assert.equal(updated.status, 200);
  assert.deepEqual(await updated.json(), { ...clase, cupoMaximo: 20 });
  assert.equal((await request('/abc')).status, 400);
  assert.equal((await request('/0')).status, 400);

  assert.equal((await request('/1', 'DELETE')).status, 204);
  assert.deepEqual(await (await request()).json(), []);
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const response = await request('/1', method, method === 'PATCH' ? { nombre: 'Pilates' } : undefined);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'CLASE_NOT_FOUND');
  }
});
