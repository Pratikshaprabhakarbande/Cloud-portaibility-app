/**
 * Structured application logger (Winston).
 * JSON logs in production, colorized human-readable logs in development.
 */
import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`)
);

const prodFormat = combine(timestamp(), json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  // Don't crash the process on a logging error
  exitOnError: false
});

export default logger;
