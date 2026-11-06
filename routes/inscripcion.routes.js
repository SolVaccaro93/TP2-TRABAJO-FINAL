import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearInscripcionSchema } from '../schemas/inscripcion.schema.js';

export const makeInscripcionRouter = ({ inscripcionController }) => {
  const router = Router();

  router.get('/', inscripcionController.listar);
  router.get('/:id', validate({ params: idParamSchema }), inscripcionController.obtener);
  router.post('/', validate({ body: crearInscripcionSchema }), inscripcionController.crear);
  router.delete('/:id', validate({ params: idParamSchema }), inscripcionController.eliminar);

  return router;
};