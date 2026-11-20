// Datos iniciales. Editá estas listas para cambiar lo que arranca en la base.
const socios = [
  { nombre: 'Ana', apellido: 'Pérez', email: 'ana.perez@mail.com', telefono: '1122334455', activo: true },
  { nombre: 'Luis', apellido: 'Gómez', email: 'luis.gomez@mail.com', telefono: '1133445566', activo: true },
  { nombre: 'Marta', apellido: 'Rossi', email: 'marta.rossi@mail.com', activo: false },
];

const clases = [
  { nombre: 'Spinning', descripcion: 'Ciclismo indoor', cupoMaximo: 2 },
  { nombre: 'Yoga', descripcion: 'Estiramiento y respiración', cupoMaximo: 15 },
  { nombre: 'Funcional', cupoMaximo: 10 },
];

// Pares [índice de socio, índice de clase] dentro de las listas de arriba
const inscripciones = [
  [0, 0],
  [1, 0], // Spinning queda con el cupo lleno (2/2)
  [0, 1],
];

const crearTodos = async (dao, lista) => {
  const creados = [];
  for (const item of lista) creados.push(await dao.create(item));
  return creados;
};

// Cada tabla se carga solo si está vacía, así reiniciar no duplica ni pisa datos
export const seed = async ({ socioDao, claseDao, inscripcionDao }) => {
  const sociosDb = (await socioDao.getAll()).length ? await socioDao.getAll() : await crearTodos(socioDao, socios);
  const clasesDb = (await claseDao.getAll()).length ? await claseDao.getAll() : await crearTodos(claseDao, clases);

  if ((await inscripcionDao.getAll()).length === 0) {
    for (const [s, c] of inscripciones) {
      // Si el usuario editó/borró datos, solo se cargan los pares que existan
      if (sociosDb[s] && clasesDb[c]) {
        await inscripcionDao.create({ socioId: sociosDb[s].id, claseId: clasesDb[c].id });
      }
    }
  }
};
