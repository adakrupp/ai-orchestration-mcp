/**
 * Custom error classes
 * Provides specific error types for better error handling
 */

/**
 * Base class for all custom errors
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 * Thrown when input validation fails
 */
export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Configuration error
 * Thrown when configuration is invalid or missing
 */
export class ConfigurationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Provider error
 * Thrown when a provider operation fails
 */
export class ProviderError extends BaseError {
  public readonly provider?: string;
  public readonly statusCode?: number;

  constructor(message: string, provider?: string, statusCode?: number) {
    super(message);
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

/**
 * Network error
 * Thrown when network operations fail
 */
export class NetworkError extends BaseError {
  public readonly statusCode?: number;
  public readonly url?: string;

  constructor(message: string, statusCode?: number, url?: string) {
    super(message);
    this.statusCode = statusCode;
    this.url = url;
  }
}

/**
 * Timeout error
 * Thrown when an operation times out
 */
export class TimeoutError extends BaseError {
  public readonly timeout: number;

  constructor(message: string, timeout: number) {
    super(message);
    this.timeout = timeout;
  }
}

/**
 * Authentication error
 * Thrown when authentication fails (invalid API key, etc.)
 */
export class AuthenticationError extends BaseError {
  public readonly provider?: string;

  constructor(message: string, provider?: string) {
    super(message);
    this.provider = provider;
  }
}

/**
 * Rate limit error
 * Thrown when rate limits are exceeded
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}
