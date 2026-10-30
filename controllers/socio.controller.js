export const makeSocioController = ({ socioUseCases }) => ({
  listar: async (req, res) => {
    const socios = await socioUseCases.listar();
    return res.status(200).json(socios);
  },

  obtener: async (req, res) => {
    const socio = await socioUseCases.obtener(req.params.id);
    return res.status(200).json(socio);
  },

  crear: async (req, res) => {
    const socio = await socioUseCases.crear(req.body);
    return res.status(201).json(socio);
  },

  actualizar: async (req, res) => {
    const socio = await socioUseCases.actualizar(req.params.id, req.body);
    return res.status(200).json(socio);
  },

  eliminar: async (req, res) => {
    await socioUseCases.eliminar(req.params.id);
    return res.status(204).end();
  },
});
