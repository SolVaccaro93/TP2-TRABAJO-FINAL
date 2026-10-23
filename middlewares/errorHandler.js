import { AppError } from '../errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  // 1. Errores de dominio: los conocemos, respondemos con sus datos
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // 2. JSON mal formado en el body (lo tira express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El body no es un JSON válido', details: null },
    });
  }

  // 3. Cualquier otra cosa es un bug: 500 sin filtrar detalles internos
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor', details: null },
  });
};
