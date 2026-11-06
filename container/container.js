import { Router } from 'express';
import { SocioMemoryDao } from '../dao/memory/socio.memory.dao.js';
import { makeSocioUseCases } from '../usecases/socio.usecases.js';
import { makeSocioController } from '../controllers/socio.controller.js';
import { makeSocioRouter } from '../routes/socio.routes.js';
import { ClaseMemoryDao } from '../dao/memory/clase.memory.dao.js';
import { makeClaseUseCases } from '../usecases/clase.usecases.js';
import { makeClaseController } from '../controllers/clase.controller.js';
import { makeClaseRouter } from '../routes/clase.routes.js';

export const makeContainer = () => {
  // DAOs
  const socioDao = new SocioMemoryDao();
  const claseDao = new ClaseMemoryDao();

  // Casos de uso
  const socioUseCases = makeSocioUseCases({ socioDao });
  const claseUseCases = makeClaseUseCases({ claseDao });

  // Controllers
  const socioController = makeSocioController({ socioUseCases });
  const claseController = makeClaseController({ claseUseCases });

  // Router principal
  const router = Router();
  router.use('/socios', makeSocioRouter({ socioController }));
  router.use('/clases', makeClaseRouter({ claseController }));

  return router;
};
