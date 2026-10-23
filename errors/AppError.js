export class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static notFound(message, code = 'NOT_FOUND') {
    return new AppError(code, message, 404);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(code, message, 409);
  }
}
