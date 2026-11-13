import { AppError } from '../errors/AppError.js';

export const makeClaseUseCases = ({ claseDao, eventBus }) => {
  const obtenerOFallar = async (id) => {
    const clase = await claseDao.getById(id);
    if (!clase) throw AppError.notFound(`Clase ${id} no encontrada`, 'CLASE_NOT_FOUND');
    return clase;
  };

  return {
    listar: () => claseDao.getAll(),
    obtener: (id) => obtenerOFallar(id),
    crear: (data) => claseDao.create(data),
    actualizar: async (id, data) => {
      await obtenerOFallar(id);
      return claseDao.update(id, data);
    },
    eliminar: async (id) => {
      await obtenerOFallar(id);
      await claseDao.delete(id);
    },
  };
};
