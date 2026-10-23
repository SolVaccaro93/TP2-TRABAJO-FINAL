import { AppError } from '../errors/AppError.js';

// Uso: validate({ body: crearSocioSchema, params: idParamSchema })
export const validate = (schemas) => (req, res, next) => {
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;

    const result = schemas[key].safeParse(req[key]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(AppError.badRequest(`Datos inválidos en ${key}`, details));
    }

    // Reemplazamos por los datos ya validados y transformados (ej: "5" -> 5)
    // En Express 5 req.query es de solo lectura, por eso se redefine
    Object.defineProperty(req, key, { value: result.data, writable: true });
  }
  next();
};
