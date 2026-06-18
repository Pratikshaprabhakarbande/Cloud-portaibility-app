/**
 * Wraps an async Express handler so rejected promises are forwarded to next().
 * Avoids repetitive try/catch in every controller.
 */
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
