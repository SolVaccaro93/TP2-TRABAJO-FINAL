import { Inscripcion } from '../models/index.js';
import { toPlain } from './socio.sqlite.dao.js';

export class InscripcionSqliteDao {
  async getAll() {
    return (await Inscripcion.findAll({ order: [['id', 'ASC']] })).map(toPlain);
  }

  async getById(id) {
    return toPlain(await Inscripcion.findByPk(id));
  }

  // Para la regla de inscripción duplicada
  async getBySocioAndClase(socioId, claseId) {
    return toPlain(await Inscripcion.findOne({ where: { socioId, claseId } }));
  }

  // Para la regla de cupo
  async countByClase(claseId) {
    return Inscripcion.count({ where: { claseId } });
  }

  async create(data) {
    return toPlain(await Inscripcion.create(data));
  }

  async delete(id) {
    return (await Inscripcion.destroy({ where: { id } })) > 0;
  }
}
