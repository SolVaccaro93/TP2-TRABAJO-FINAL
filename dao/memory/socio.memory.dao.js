export class SocioMemoryDao {
  constructor() {
    this.socios = [];
    this.nextId = 1;
  }

  async getAll() {
    return this.socios.map((s) => ({ ...s }));
  }

  async getById(id) {
    const socio = this.socios.find((s) => s.id === id);
    return socio ? { ...socio } : null;
  }

  async getByEmail(email) {
    const socio = this.socios.find((s) => s.email === email);
    return socio ? { ...socio } : null;
  }

  async create(data) {
    const socio = { id: this.nextId++, ...data };
    this.socios.push(socio);
    return { ...socio };
  }

  async update(id, data) {
    const index = this.socios.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.socios[index] = { ...this.socios[index], ...data, id };
    return { ...this.socios[index] };
  }

  async delete(id) {
    const index = this.socios.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.socios.splice(index, 1);
    return true;
  }
}
