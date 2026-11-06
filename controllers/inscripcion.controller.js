export const makeInscripcionController = ({ inscripcionUseCases }) => ({
  listar: async (req, res) => {
    const inscripciones = await inscripcionUseCases.listar();
    return res.status(200).json(inscripciones);
  },

  obtener: async (req, res) => {
    const inscripcion = await inscripcionUseCases.obtener(req.params.id);
    return res.status(200).json(inscripcion);
  },

  crear: async (req, res) => {
    const inscripcion = await inscripcionUseCases.crear(req.body);
    return res.status(201).json(inscripcion);
  },

  eliminar: async (req, res) => {
    await inscripcionUseCases.eliminar(req.params.id);
    return res.status(204).end();
  },
});
