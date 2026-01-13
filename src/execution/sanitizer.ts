/**
 * Input sanitization utilities
 * Validates and sanitizes user inputs to prevent injection attacks
 */

import { ValidationError } from '../utils/errors.js';

/**
 * Input sanitizer for user-provided data
 */
export class InputSanitizer {
  /**
   * Validate and sanitize a prompt
   * @param prompt The prompt to validate
   * @param maxLength Maximum allowed length
   * @returns Sanitized prompt
   * @throws ValidationError if validation fails
   */
  static validatePrompt(prompt: string, maxLength: number = 100000): string {
    if (typeof prompt !== 'string') {
      throw new ValidationError('Prompt must be a string');
    }

    if (prompt.length === 0) {
      throw new ValidationError('Prompt cannot be empty');
    }

    if (prompt.length > maxLength) {
      throw new ValidationError(
        `Prompt exceeds maximum length of ${maxLength} characters`
      );
    }

    // Check for null bytes (can cause issues in some systems)
    if (prompt.includes('\0')) {
      throw new ValidationError('Prompt contains null bytes');
    }

    return prompt;
  }

  /**
   * Validate a system prompt
   * @param system The system prompt to validate
   * @param maxLength Maximum allowed length
   * @returns Sanitized system prompt
   * @throws ValidationError if validation fails
   */
  static validateSystem(system: string | undefined, maxLength: number = 10000): string | undefined {
    if (system === undefined || system === null) {
      return undefined;
    }

    if (typeof system !== 'string') {
      throw new ValidationError('System prompt must be a string');
    }

    if (system.length > maxLength) {
      throw new ValidationError(
        `System prompt exceeds maximum length of ${maxLength} characters`
      );
    }

    // Check for null bytes
    if (system.includes('\0')) {
      throw new ValidationError('System prompt contains null bytes');
    }

    return system;
  }

  /**
   * Validate a model name against allowed models
   * @param model The model name to validate
   * @param allowedModels List of allowed model names
   * @returns The validated model name
   * @throws ValidationError if model is not allowed
   */
  static validateModel(model: string, allowedModels: string[]): string {
    if (typeof model !== 'string') {
      throw new ValidationError('Model must be a string');
    }

    if (model.length === 0) {
      throw new ValidationError('Model name cannot be empty');
    }

    // Check if model is in allowed list
    if (!allowedModels.includes(model)) {
      throw new ValidationError(
        `Invalid model: ${model}. Allowed models: ${allowedModels.join(', ')}`
      );
    }

    return model;
  }

  /**
   * Validate temperature parameter
   * @param temperature The temperature value
   * @returns Validated temperature
   * @throws ValidationError if temperature is invalid
   */
  static validateTemperature(temperature: number | undefined): number | undefined {
    if (temperature === undefined || temperature === null) {
      return undefined;
    }

    if (typeof temperature !== 'number' || isNaN(temperature)) {
      throw new ValidationError('Temperature must be a number');
    }

    if (temperature < 0 || temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }

    return temperature;
  }

  /**
   * Validate max tokens parameter
   * @param maxTokens The max tokens value
   * @returns Validated max tokens
   * @throws ValidationError if max tokens is invalid
   */
  static validateMaxTokens(maxTokens: number | undefined): number | undefined {
    if (maxTokens === undefined || maxTokens === null) {
      return undefined;
    }

    if (typeof maxTokens !== 'number' || isNaN(maxTokens)) {
      throw new ValidationError('Max tokens must be a number');
    }

    if (maxTokens < 1 || maxTokens > 1000000) {
      throw new ValidationError('Max tokens must be between 1 and 1,000,000');
    }

    return Math.floor(maxTokens);
  }

  /**
   * Sanitize a URL to ensure it's safe
   * @param url The URL to sanitize
   * @returns Sanitized URL
   * @throws ValidationError if URL is invalid
   */
  static validateUrl(url: string): string {
    if (typeof url !== 'string') {
      throw new ValidationError('URL must be a string');
    }

    try {
      const parsed = new URL(url);

      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ValidationError('URL must use HTTP or HTTPS protocol');
      }

      return url;
    } catch (error) {
      throw new ValidationError(`Invalid URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove potentially dangerous shell metacharacters
   * This is a defense-in-depth measure - we should NOT be using shell execution at all
   * @param input The input to sanitize
   * @returns Sanitized input
   */
  static removeShellMetacharacters(input: string): string {
    // Remove shell metacharacters: $, `, \, ", ', ;, |, &, <, >, (, ), etc.
    return input.replace(/[$`\\"';|&<>()]/g, '');
  }
}
