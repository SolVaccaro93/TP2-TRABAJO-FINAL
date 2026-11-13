export const registerInscripcionListener = ({ eventBus, notifier, logger = console }) => {
  const onInscripcionCreada = (inscripcion) => {
    try {
      notifier.notificarInscripcionCreada(inscripcion);
    } catch (error) {
      logger.error('Error en el listener inscripcion.creada:', error);
    }
  };

  eventBus.on('inscripcion.creada', onInscripcionCreada);
  return () => eventBus.off('inscripcion.creada', onInscripcionCreada);
};
