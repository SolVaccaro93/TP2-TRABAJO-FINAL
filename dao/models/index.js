import { Sequelize, DataTypes } from 'sequelize';
import { config } from '../../config/config.js';

// Un solo lugar para la conexión, los modelos y las asociaciones
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.db.storage,
  logging: false,
});

const opciones = { timestamps: false };

export const Socio = sequelize.define(
  'Socio',
  {
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    apellido: { type: DataTypes.STRING(50), allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    telefono: { type: DataTypes.STRING(20) },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  opciones
);

export const Clase = sequelize.define(
  'Clase',
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(500) },
    cupoMaximo: { type: DataTypes.INTEGER, allowNull: false },
  },
  opciones
);

export const Inscripcion = sequelize.define('Inscripcion', {}, opciones);

Socio.hasMany(Inscripcion, { foreignKey: { name: 'socioId', allowNull: false }, onDelete: 'CASCADE' });
Inscripcion.belongsTo(Socio, { foreignKey: 'socioId' });
Clase.hasMany(Inscripcion, { foreignKey: { name: 'claseId', allowNull: false }, onDelete: 'CASCADE' });
Inscripcion.belongsTo(Clase, { foreignKey: 'claseId' });

export const initDb = () => sequelize.sync();
