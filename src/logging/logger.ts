/**
 * Logging infrastructure using Winston
 * Provides structured logging with sensitive data redaction
 */

import winston from 'winston';
import { ServerConfig } from '../types/config.js';

/**
 * Sensitive keys that should be redacted from logs
 */
const SENSITIVE_KEYS = [
  'apikey',
  'api_key',
  'token',
  'password',
  'secret',
  'authorization',
  'auth',
  'bearer',
  'credentials',
];

/**
 * Logger class
 * Wraps Winston logger with custom formatting and sensitive data redaction
 */
export class Logger {
  private logger: winston.Logger;

  /**
   * Constructor
   * @param config Server configuration
   */
  constructor(config: ServerConfig) {
    // Create Winston logger
    this.logger = winston.createLogger({
      level: config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [],
    });

    // Add console transport
    this.logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? ` ${JSON.stringify(this.sanitizeLogData(meta))}`
              : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        ),
      })
    );

    // Add file transport if configured
    if (config.logFile) {
      this.logger.add(
        new winston.transports.File({
          filename: config.logFile,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true,
        })
      );
    }
  }

  /**
   * Log debug message
   * @param message Log message
   * @param meta Additional metadata
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.sanitizeLogData(meta));
  }

  /**
   * Log info message
   * @param message Log message
   * @param meta Additional metadata
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, this.sanitizeLogData(meta));
  }

  /**
   * Log warning message
   * @param message Log message
   * @param meta Additional metadata
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.sanitizeLogData(meta));
  }

  /**
   * Log error message
   * @param message Log message
   * @param meta Additional metadata (can include error object)
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, this.sanitizeLogData(meta));
  }

  /**
   * Sanitize log data to remove sensitive information
   * @param data Data to sanitize
   * @returns Sanitized data
   */
  private sanitizeLogData(data: any): any {
    if (data === undefined || data === null) {
      return data;
    }

    // Handle Error objects specially
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeLogData(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Check if key contains sensitive data
        const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey)
        );

        if (isSensitive) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = this.sanitizeLogData(value);
        }
      }

      return sanitized;
    }

    // Primitive types
    return data;
  }

  /**
   * Set log level
   * @param level New log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logger.level = level;
  }
}
