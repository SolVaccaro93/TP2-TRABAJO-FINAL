import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  persistenceType: process.env.PERSISTENCE_TYPE || 'memory', // 'memory' | 'sqlite'
  db: {
    storage: process.env.DB_STORAGE || './fitjs.sqlite',
  },
};