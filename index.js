import express from 'express';
import { config } from './config/config.js';
import { makeContainer } from './container/container.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());

app.use(makeContainer());

// Siempre al final: primero el 404 de rutas, después el manejador de errores
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Fit.js escuchando en http://localhost:${config.port}`);
});
