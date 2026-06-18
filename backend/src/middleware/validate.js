/**
 * Validation middleware.
 * Runs an array of express-validator chains, then aggregates any errors into a
 * single 400 ApiError with structured details.
 */
import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export default function validate(validations) {
  return async (req, _res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest('Validation failed', details));
  };
}
