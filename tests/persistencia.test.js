import test from 'node:test';
import assert from 'node:assert/strict';

// Base SQLite en memoria; tiene que setearse antes de importar la config
process.env.DB_STORAGE = ':memory:';

const express = (await import('express')).default;
const { makeContainer } = await import('../container/container.js');
const { makeDaos } = await import('../dao/dao.factory.js');
const { errorHandler } = await import('../middlewares/errorHandler.js');
const { notFound } = await import('../middlewares/notFound.js');

// Corre un escenario completo contra un modo y devuelve [status, body] de cada paso
const correrEscenario = async (persistenceType) => {
  const app = express();
  app.use(express.json());
  app.use(makeContainer({ daos: await makeDaos(persistenceType) }));
  app.use(notFound);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const resultados = [];
  const paso = async (path, method = 'GET', body) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const texto = await res.text();
    resultados.push([method, path, res.status, texto ? JSON.parse(texto) : null]);
  };

  try {
    await paso('/socios');
    await paso('/socios', 'POST', { nombre: 'Ana', apellido: 'Pérez', email: 'ana@mail.com' });
    await paso('/socios', 'POST', { nombre: 'Luis', apellido: 'Gómez', email: 'luis@mail.com', telefono: '11', activo: false });
    await paso('/socios', 'POST', { nombre: 'Otra', apellido: 'Ana', email: 'ana@mail.com' }); // email duplicado
    await paso('/socios/1');
    await paso('/socios/99');
    await paso('/socios/1', 'PATCH', { telefono: '1122' });
    await paso('/socios/99', 'PATCH', { nombre: 'Nadie' });
    await paso('/clases', 'POST', { nombre: 'Spinning', cupoMaximo: 1 });
    await paso('/clases', 'POST', { nombre: 'Yoga', descripcion: 'Relax', cupoMaximo: 10 });
    await paso('/clases/1', 'PATCH', { descripcion: 'Ciclismo' });
    await paso('/clases');
    await paso('/inscripciones', 'POST', { socioId: 1, claseId: 1 });
    await paso('/inscripciones', 'POST', { socioId: 1, claseId: 1 }); // duplicada
    await paso('/inscripciones', 'POST', { socioId: 2, claseId: 1 }); // sin cupo
    await paso('/inscripciones', 'POST', { socioId: 99, claseId: 1 }); // socio inexistente
    await paso('/inscripciones');
    await paso('/inscripciones/1');
    await paso('/inscripciones/1', 'DELETE');
    await paso('/inscripciones/1', 'DELETE');
    await paso('/socios/2', 'DELETE');
    await paso('/clases/2', 'DELETE');
    await paso('/socios');
    await paso('/clases');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  return resultados;
};

test('memory y sqlite responden igual al mismo escenario', async () => {
  const memory = await correrEscenario('memory');
  const sqlite = await correrEscenario('sqlite');
  assert.deepEqual(sqlite, memory);
});

test('persistenceType inválido falla con un mensaje claro', async () => {
  await assert.rejects(() => makeDaos('mongo'), /PERSISTENCE_TYPE inválido/);
});
