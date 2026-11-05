import { Router } from 'express';
import { SocioMemoryDao } from '../dao/memory/socio.memory.dao.js';
import { makeSocioUseCases } from '../usecases/socio.usecases.js';
import { makeSocioController } from '../controllers/socio.controller.js';
import { makeSocioRouter } from '../routes/socio.routes.js';

export const makeContainer = () => {
  // DAOs
  const socioDao = new SocioMemoryDao();

  // Casos de uso
  const socioUseCases = makeSocioUseCases({ socioDao });

  // Controllers
  const socioController = makeSocioController({ socioUseCases });

  // Router principal
  const router = Router();
  router.use('/socios', makeSocioRouter({ socioController }));

  return router;
};
