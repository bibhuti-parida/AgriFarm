export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED', details = null) {
    return new ApiError(401, code, message, details);
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN', details = null) {
    return new ApiError(403, code, message, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    return new ApiError(404, code, message, details);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT', details = null) {
    return new ApiError(409, code, message, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = null) {
    return new ApiError(500, code, message, details);
  }
}

