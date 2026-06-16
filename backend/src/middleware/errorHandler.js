/**
 * Centralized error handling.
 * - `notFound`: 404 for unmatched routes.
 * - `errorConverter`: normalizes known errors (Mongoose, JWT) into ApiError.
 * - `errorHandler`: final handler — never leaks stack traces in production.
 */
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorConverter(err, _req, _res, next) {
  let error = err;
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = error.message || 'Internal Server Error';
    let details;

    if (error instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      message = 'Validation failed';
      details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    } else if (error instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
    } else if (error.code === 11000) {
      // Mongo duplicate key
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = `Duplicate value for '${field}'`;
    }

    error = new ApiError(statusCode, message, { isOperational: false, details });
  }
  next(error);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  // Log server errors with stack; client errors at warn level.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}: ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${err.message}`);
  }

  const body = {
    success: false,
    message: statusCode >= 500 && env.isProd ? 'Internal Server Error' : err.message
  };
  if (err.details) body.errors = err.details;
  if (!env.isProd && err.stack) body.stack = err.stack;

  res.status(statusCode).json(body);
}

export default errorHandler;
