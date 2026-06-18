/**
 * Standardized API response envelope.
 *   { success, message, data }  for success
 *   { success: false, message, ... } for errors (handled in errorHandler)
 */
export function sendSuccess(res, { statusCode = 200, message = 'OK', data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendCreated(res, { message = 'Created', data = null } = {}) {
  return sendSuccess(res, { statusCode: 201, message, data });
}
