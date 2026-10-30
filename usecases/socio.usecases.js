import { AppError } from '../errors/AppError.js';

export const makeSocioUseCases = ({ socioDao }) => {
  const obtenerOFallar = async (id) => {
    const socio = await socioDao.getById(id);
    if (!socio) throw AppError.notFound(`Socio ${id} no encontrado`, 'SOCIO_NOT_FOUND');
    return socio;
  };

  // excludeId permite que un socio conserve su propio email al actualizar
  const verificarEmailUnico = async (email, excludeId = null) => {
    const existente = await socioDao.getByEmail(email);
    if (existente && existente.id !== excludeId) {
      throw AppError.conflict(`Ya existe un socio con el email ${email}`, 'EMAIL_DUPLICADO');
    }
  };

  return {
    listar: () => socioDao.getAll(),

    obtener: (id) => obtenerOFallar(id),

    crear: async (data) => {
      await verificarEmailUnico(data.email);
      return socioDao.create(data);
    },

    actualizar: async (id, data) => {
      await obtenerOFallar(id);
      if (data.email) await verificarEmailUnico(data.email, id);
      return socioDao.update(id, data);
    },

    eliminar: async (id) => {
      await obtenerOFallar(id);
      await socioDao.delete(id);
    },
  };
};
