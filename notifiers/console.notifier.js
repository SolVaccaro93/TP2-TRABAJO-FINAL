export const makeConsoleNotifier = ({ logger = console } = {}) => ({
  notificarInscripcionCreada(inscripcion) {
    logger.log(
      `Inscripción ${inscripcion.id} creada para el socio ${inscripcion.socioId} en la clase ${inscripcion.claseId}`
    );
  },
});
