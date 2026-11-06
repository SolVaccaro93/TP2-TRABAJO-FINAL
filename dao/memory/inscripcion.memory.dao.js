export class InscripcionMemoryDao {
  constructor() {
    this.inscripciones = [];
    this.nextId = 1;
  }

  async getAll() {
    return this.inscripciones.map((i) => ({ ...i }));
  }

  async getById(id) {
    const inscripcion = this.inscripciones.find((i) => i.id === id);
    return inscripcion ? { ...inscripcion } : null;
  }

  // Para la regla de inscripción duplicada
  async getBySocioAndClase(socioId, claseId) {
    const inscripcion = this.inscripciones.find(
      (i) => i.socioId === socioId && i.claseId === claseId
    );
    return inscripcion ? { ...inscripcion } : null;
  }

  // Para la regla de cupo
  async countByClase(claseId) {
    return this.inscripciones.filter((i) => i.claseId === claseId).length;
  }

  async create(data) {
    const inscripcion = { ...data, id: this.nextId++ };
    this.inscripciones.push(inscripcion);
    return { ...inscripcion };
  }

  async delete(id) {
    const index = this.inscripciones.findIndex((i) => i.id === id);
    if (index === -1) return false;
    this.inscripciones.splice(index, 1);
    return true;
  }
}