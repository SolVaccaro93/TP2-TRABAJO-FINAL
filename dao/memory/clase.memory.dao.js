export class ClaseMemoryDao {
  constructor() {
    this.clases = [];
    this.nextId = 1;
  }

  async getAll() {
    return this.clases.map((clase) => ({ ...clase }));
  }

  async getById(id) {
    const clase = this.clases.find((clase) => clase.id === id);
    return clase ? { ...clase } : null;
  }

  async create(data) {
    const clase = { ...data, id: this.nextId++ };
    this.clases.push(clase);
    return { ...clase };
  }

  async update(id, data) {
    const index = this.clases.findIndex((clase) => clase.id === id);
    if (index === -1) return null;
    this.clases[index] = { ...this.clases[index], ...data, id };
    return { ...this.clases[index] };
  }

  async delete(id) {
    const index = this.clases.findIndex((clase) => clase.id === id);
    if (index === -1) return false;
    this.clases.splice(index, 1);
    return true;
  }
}
