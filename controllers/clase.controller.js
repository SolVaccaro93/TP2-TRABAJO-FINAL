export const makeClaseController = ({ claseUseCases }) => ({
  listar: async (req, res) => {
    const clases = await claseUseCases.listar();
    return res.status(200).json(clases);
  },

  obtener: async (req, res) => {
    const clase = await claseUseCases.obtener(req.params.id);
    return res.status(200).json(clase);
  },

  crear: async (req, res) => {
    const clase = await claseUseCases.crear(req.body);
    return res.status(201).json(clase);
  },

  actualizar: async (req, res) => {
    const clase = await claseUseCases.actualizar(req.params.id, req.body);
    return res.status(200).json(clase);
  },

  eliminar: async (req, res) => {
    await claseUseCases.eliminar(req.params.id);
    return res.status(204).end();
  },
});
