import { Clase } from '../models/index.js';
import { toPlain } from './socio.sqlite.dao.js';

export class ClaseSqliteDao {
  async getAll() {
    return (await Clase.findAll({ order: [['id', 'ASC']] })).map(toPlain);
  }

  async getById(id) {
    return toPlain(await Clase.findByPk(id));
  }

  async create(data) {
    return toPlain(await Clase.create(data));
  }

  async update(id, data) {
    const clase = await Clase.findByPk(id);
    if (!clase) return null;
    return toPlain(await clase.update(data));
  }

  async delete(id) {
    return (await Clase.destroy({ where: { id } })) > 0;
  }
}
