import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

import 'winston-daily-rotate-file';

import { sanitiseBody } from '../utils';

const { combine, timestamp, ms, errors, json, colorize, splat } =
  winston.format;

const isProduction = process.env.NODE_ENV === 'production';

// Custom format: redact sensitive fields
const redactSensitiveFields = winston.format((info) => {
  // Redact the main message if it's an object
  if (info.message && typeof info.message === 'object') {
    info.message = sanitiseBody(info.message);
  }

  // Redact any metadata properties
  // We iterate through the info object keys (excluding internal winston keys)
  const internalKeys = ['level', 'message', 'timestamp', 'ms', 'stack'];
  Object.keys(info).forEach((key) => {
    if (!internalKeys.includes(key)) {
      info[key] = sanitiseBody(info[key]);
    }
  });

  return info;
});

// Transports

const nestLikeFormat = nestWinstonModuleUtilities.format.nestLike('App', {
  prettyPrint: true,
  colors: true,
});

const base_format = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  redactSensitiveFields(),
);

// Pretty-printed, colorised output for the developer console
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize({ all: true }),
    ms(),
    splat(),
    base_format,
    nestLikeFormat,
  ),
});

// Rotates a new combined log file every day, keeps 14 days, compresses old ones
const dailyRotateAllTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: combine(base_format, json()),
});

// Separate file that captures ONLY errors
const dailyRotateErrorTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: combine(base_format, json()),
});

const dailyRotateAuditTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '365d', // Keep audit trails for 1 year
  level: 'info',
  format: combine(
    base_format,
    // only keep 'AUDIT' logs
    winston.format((info) => (info.type === 'AUDIT' ? info : false))(),
    json(),
  ),
});

const dailyRotateSecurityTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/security-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d', // shorter than audit but longer than normal logs
  level: 'warn', // security logs use warn
  format: combine(
    base_format,
    // Only keep SECURITY logs
    winston.format((info) => (info.type === 'SECURITY' ? info : false))(),
    json(),
  ),
});

export const winstonConfig: winston.LoggerOptions = {
  //  Log everything in development, only info+ in production.
  //  Override at runtime via LOG_LEVEL env var.

  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),

  transports: isProduction
    ? [
        consoleTransport,
        dailyRotateAllTransport,
        dailyRotateErrorTransport,
        dailyRotateAuditTransport,
        dailyRotateSecurityTransport,
      ]
    : [consoleTransport],

  // Prevent Winston from exiting on handled exceptions
  exitOnError: false,
};
