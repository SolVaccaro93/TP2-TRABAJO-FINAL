import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearClaseSchema, actualizarClaseSchema } from '../schemas/clase.schema.js';

export const makeClaseRouter = ({ claseController }) => {
  const router = Router();

  router.get('/', claseController.listar);
  router.get('/:id', validate({ params: idParamSchema }), claseController.obtener);
  router.post('/', validate({ body: crearClaseSchema }), claseController.crear);
  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: actualizarClaseSchema }),
    claseController.actualizar
  );
  router.delete('/:id', validate({ params: idParamSchema }), claseController.eliminar);

  return router;
};
