import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { crearSocioSchema, actualizarSocioSchema } from '../schemas/socio.schema.js';

export const makeSocioRouter = ({ socioController }) => {
  const router = Router();

  router.get('/', socioController.listar);
  router.get('/:id', validate({ params: idParamSchema }), socioController.obtener);
  router.post('/', validate({ body: crearSocioSchema }), socioController.crear);
  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: actualizarSocioSchema }),
    socioController.actualizar
  );
  router.delete('/:id', validate({ params: idParamSchema }), socioController.eliminar);

  return router;
};