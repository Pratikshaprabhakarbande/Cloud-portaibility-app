/**
 * Operational error with an attached HTTP status code.
 * Thrown by services/repositories and translated to a response by the
 * centralized error handler (Phase 5).
 */
export default class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Human-readable message
   * @param {object} [options]
   * @param {boolean} [options.isOperational=true]
   * @param {*} [options.details] Optional structured details (e.g. validation)
   */
  constructor(statusCode, message, { isOperational = true, details } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', details) {
    return new ApiError(400, msg, { details });
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }
  static internal(msg = 'Internal Server Error') {
    return new ApiError(500, msg, { isOperational: false });
  }
}
