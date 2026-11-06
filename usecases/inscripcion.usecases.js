import { AppError } from '../errors/AppError.js';

export const makeInscripcionUseCases = ({ inscripcionDao, socioDao, claseDao }) => {
  const obtenerOFallar = async (id) => {
    const inscripcion = await inscripcionDao.getById(id);
    if (!inscripcion) {
      throw AppError.notFound(`Inscripción ${id} no encontrada`, 'INSCRIPCION_NOT_FOUND');
    }
    return inscripcion;
  };

  return {
    listar: () => inscripcionDao.getAll(),

    obtener: (id) => obtenerOFallar(id),

    crear: async ({ socioId, claseId }) => {
      // 1. El socio y la clase tienen que existir (404)
      const socio = await socioDao.getById(socioId);
      if (!socio) throw AppError.notFound(`Socio ${socioId} no encontrado`, 'SOCIO_NOT_FOUND');

      const clase = await claseDao.getById(claseId);
      if (!clase) throw AppError.notFound(`Clase ${claseId} no encontrada`, 'CLASE_NOT_FOUND');

      // 2. No puede haber inscripción duplicada (409)
      const existente = await inscripcionDao.getBySocioAndClase(socioId, claseId);
      if (existente) {
        throw AppError.conflict(
          `El socio ${socioId} ya está inscripto en la clase ${claseId}`,
          'INSCRIPCION_DUPLICADA'
        );
      }

      // 3. La clase tiene que tener cupo (409)
      const inscriptos = await inscripcionDao.countByClase(claseId);
      if (inscriptos >= clase.cupoMaximo) {
        throw AppError.conflict(`La clase ${claseId} no tiene cupo disponible`, 'CLASE_SIN_CUPO');
      }

      return inscripcionDao.create({ socioId, claseId });
    },

    eliminar: async (id) => {
      await obtenerOFallar(id);
      await inscripcionDao.delete(id);
    },
  };
};