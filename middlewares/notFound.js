import { AppError } from '../errors/AppError.js';

export const notFound = (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada`, 'ROUTE_NOT_FOUND'));
};
