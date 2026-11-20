// Socios iniciales. Editá esta lista para cambiar los datos de arranque.
const sociosIniciales = [
  { nombre: 'Ana', apellido: 'Pérez', email: 'ana.perez@mail.com', telefono: '1122334455', activo: true },
  { nombre: 'Luis', apellido: 'Gómez', email: 'luis.gomez@mail.com', telefono: '1133445566', activo: true },
  { nombre: 'Marta', apellido: 'Rossi', email: 'marta.rossi@mail.com', activo: false },
];

// Solo carga si no hay ningún socio, así reiniciar no duplica ni pisa datos
export const seedSocios = async (socioDao) => {
  if ((await socioDao.getAll()).length > 0) return 0;
  for (const socio of sociosIniciales) await socioDao.create(socio);
  return sociosIniciales.length;
};
