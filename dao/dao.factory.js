import { SocioMemoryDao } from './memory/socio.memory.dao.js';
import { ClaseMemoryDao } from './memory/clase.memory.dao.js';
import { InscripcionMemoryDao } from './memory/inscripcion.memory.dao.js';

// Elige los DAOs según config.persistenceType ('memory' | 'sqlite').
// SQLite se importa recién acá para que el modo memory no cargue sequelize.
export const makeDaos = async (persistenceType) => {
  if (persistenceType === 'memory') {
    return {
      socioDao: new SocioMemoryDao(),
      claseDao: new ClaseMemoryDao(),
      inscripcionDao: new InscripcionMemoryDao(),
    };
  }

  if (persistenceType === 'sqlite') {
    const { initDb } = await import('./models/index.js');
    const { SocioSqliteDao } = await import('./sqlite/socio.sqlite.dao.js');
    const { ClaseSqliteDao } = await import('./sqlite/clase.sqlite.dao.js');
    const { InscripcionSqliteDao } = await import('./sqlite/inscripcion.sqlite.dao.js');
    await initDb();
    return {
      socioDao: new SocioSqliteDao(),
      claseDao: new ClaseSqliteDao(),
      inscripcionDao: new InscripcionSqliteDao(),
    };
  }

  throw new Error(`PERSISTENCE_TYPE inválido: "${persistenceType}" (usar 'memory' o 'sqlite')`);
};
