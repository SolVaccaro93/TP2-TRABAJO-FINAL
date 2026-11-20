import { Socio } from '../models/index.js';

// Objeto plano sin campos null, igual que el DAO de memoria (que no guarda campos ausentes)
export const toPlain = (row) =>
  row ? Object.fromEntries(Object.entries(row.get({ plain: true })).filter(([, v]) => v !== null)) : null;

export class SocioSqliteDao {
  async getAll() {
    return (await Socio.findAll({ order: [['id', 'ASC']] })).map(toPlain);
  }

  async getById(id) {
    return toPlain(await Socio.findByPk(id));
  }

  async getByEmail(email) {
    return toPlain(await Socio.findOne({ where: { email } }));
  }

  async create(data) {
    return toPlain(await Socio.create(data));
  }

  async update(id, data) {
    const socio = await Socio.findByPk(id);
    if (!socio) return null;
    return toPlain(await socio.update(data));
  }

  async delete(id) {
    return (await Socio.destroy({ where: { id } })) > 0;
  }
}
