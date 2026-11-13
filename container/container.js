import { Router } from 'express';
import { EventEmitter } from 'node:events';
import { SocioMemoryDao } from '../dao/memory/socio.memory.dao.js';
import { makeSocioUseCases } from '../usecases/socio.usecases.js';
import { makeSocioController } from '../controllers/socio.controller.js';
import { makeSocioRouter } from '../routes/socio.routes.js';
import { ClaseMemoryDao } from '../dao/memory/clase.memory.dao.js';
import { makeClaseUseCases } from '../usecases/clase.usecases.js';
import { makeClaseController } from '../controllers/clase.controller.js';
import { makeClaseRouter } from '../routes/clase.routes.js';
import { InscripcionMemoryDao } from '../dao/memory/inscripcion.memory.dao.js';
import { makeInscripcionUseCases } from '../usecases/inscripcion.usecases.js';
import { makeInscripcionController } from '../controllers/inscripcion.controller.js';
import { makeInscripcionRouter } from '../routes/inscripcion.routes.js';

export const makeContainer = () => {
  const eventBus = new EventEmitter();

  // DAOs
  const socioDao = new SocioMemoryDao();
  const claseDao = new ClaseMemoryDao();
  const inscripcionDao = new InscripcionMemoryDao();

  // Casos de uso (inscripciones necesita los DAOs de socio y clase para validar)
  const socioUseCases = makeSocioUseCases({ socioDao, eventBus });
  const claseUseCases = makeClaseUseCases({ claseDao, eventBus });
  const inscripcionUseCases = makeInscripcionUseCases({
    inscripcionDao,
    socioDao,
    claseDao,
    eventBus,
  });

  // Controllers
  const socioController = makeSocioController({ socioUseCases });
  const claseController = makeClaseController({ claseUseCases });
  const inscripcionController = makeInscripcionController({ inscripcionUseCases });

  // Router principal
  const router = Router();
  router.get('/', (req, res) => {
    res.status(200).json({
      nombre: 'Fit.js API',
      recursos: ['/socios', '/clases', '/inscripciones'],
    });
  });
  router.use('/socios', makeSocioRouter({ socioController }));
  router.use('/clases', makeClaseRouter({ claseController }));
  router.use('/inscripciones', makeInscripcionRouter({ inscripcionController }));

  return router;
};
