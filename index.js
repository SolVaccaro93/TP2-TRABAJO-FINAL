import { readFileSync } from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';
import { config } from './config/config.js';
import { makeContainer } from './container/container.js';
import { makeDaos } from './dao/dao.factory.js';
import { seedSocios } from './dao/seed.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const openapi = parse(readFileSync(new URL('./openapi.yaml', import.meta.url), 'utf8'));

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
const daos = await makeDaos(config.persistenceType);
if (config.persistenceType === 'sqlite') await seedSocios(daos.socioDao);
app.use(makeContainer({ daos }));

// Siempre al final: primero el 404 de rutas, después el manejador de errores
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Fit.js escuchando en http://localhost:${config.port} (persistencia: ${config.persistenceType})`);
});
