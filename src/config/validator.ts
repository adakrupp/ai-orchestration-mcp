/**
 * Configuration validation using Zod
 * Validates configuration structure and types
 */

import { z } from 'zod';

/**
 * Server configuration schema
 */
const serverConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  logFile: z.string().optional(),
  historyEnabled: z.boolean(),
  historyFile: z.string().optional(),
  historyMaxEntries: z.number().int().positive().optional(),
});

/**
 * Provider base configuration schema
 */
const providerConfigSchema = z.object({
  enabled: z.boolean(),
  timeout: z.number().int().positive().optional(),
  maxRetries: z.number().int().nonnegative().optional(),
  env: z.record(z.string()).optional(),
});

/**
 * Ollama configuration schema
 */
const ollamaConfigSchema = providerConfigSchema.extend({
  baseUrl: z.string().url().optional(),
  models: z.record(z.string()).optional(),
});

/**
 * Gemini configuration schema
 */
const geminiConfigSchema = providerConfigSchema.extend({
  apiKey: z.string().optional(),
  cliPath: z.string().optional(),
  defaultModel: z.string().optional(),
});

/**
 * OpenAI configuration schema
 */
const openaiConfigSchema = providerConfigSchema.extend({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  organization: z.string().optional(),
});

/**
 * Anthropic configuration schema
 */
const anthropicConfigSchema = providerConfigSchema.extend({
  apiKey: z.string().optional(),
  defaultModel: z.string().optional(),
});

/**
 * LlamaCpp configuration schema
 */
const llamaCppConfigSchema = providerConfigSchema.extend({
  baseUrl: z.string().url().optional(),
});

/**
 * Providers configuration schema
 */
const providersConfigSchema = z.object({
  ollama: ollamaConfigSchema.optional(),
  gemini: geminiConfigSchema.optional(),
  openai: openaiConfigSchema.optional(),
  anthropic: anthropicConfigSchema.optional(),
  llamaCpp: llamaCppConfigSchema.optional(),
});

/**
 * Rate limiting configuration schema
 */
const rateLimitingConfigSchema = z.object({
  enabled: z.boolean(),
  maxRequestsPerMinute: z.number().int().positive(),
});

/**
 * Security configuration schema
 */
const securityConfigSchema = z.object({
  allowShellExecution: z.boolean().optional(),
  maxPromptLength: z.number().int().positive().optional(),
  maxResponseLength: z.number().int().positive().optional(),
  rateLimiting: rateLimitingConfigSchema.optional(),
});

/**
 * Complete configuration schema
 */
export const configSchema = z.object({
  version: z.literal('1.0'),
  server: serverConfigSchema,
  providers: providersConfigSchema,
  security: securityConfigSchema,
});

/**
 * Validate configuration
 * @param config The configuration object to validate
 * @returns The validated configuration
 * @throws ZodError if validation fails
 */
export function validateConfig(config: unknown) {
  return configSchema.parse(config);
}
