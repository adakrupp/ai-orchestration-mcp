/**
 * Configuration type definitions
 * Defines the structure of the configuration file
 */

import { ProviderConfig } from './providers.js';

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Logging level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Optional log file path */
  logFile?: string;
  /** Whether to enable request/response history tracking */
  historyEnabled: boolean;
  /** Optional history file path (JSONL format) */
  historyFile?: string;
  /** Maximum number of history entries to keep */
  historyMaxEntries?: number;
}

/**
 * Ollama-specific configuration
 */
export interface OllamaConfig extends ProviderConfig {
  /** Ollama server base URL */
  baseUrl?: string;
  /** Model aliases for easier reference */
  models?: Record<string, string>;
}

/**
 * Gemini-specific configuration
 */
export interface GeminiConfig extends ProviderConfig {
  /** Gemini API key (or use GEMINI_API_KEY env var) */
  apiKey?: string;
  /** Path to Gemini CLI if using CLI instead of API */
  cliPath?: string;
  /** Default model to use */
  defaultModel?: string;
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends ProviderConfig {
  /** OpenAI API key (or use OPENAI_API_KEY env var) */
  apiKey?: string;
  /** Optional custom base URL */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Organization ID */
  organization?: string;
}

/**
 * Anthropic-specific configuration
 */
export interface AnthropicConfig extends ProviderConfig {
  /** Anthropic API key (or use ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** Default model to use */
  defaultModel?: string;
}

/**
 * llama.cpp-specific configuration
 */
export interface LlamaCppConfig extends ProviderConfig {
  /** llama.cpp server base URL */
  baseUrl?: string;
}

/**
 * Provider configurations
 */
export interface ProvidersConfig {
  /** Ollama configuration */
  ollama?: OllamaConfig;
  /** Gemini configuration */
  gemini?: GeminiConfig;
  /** OpenAI configuration */
  openai?: OpenAIConfig;
  /** Anthropic configuration */
  anthropic?: AnthropicConfig;
  /** llama.cpp configuration */
  llamaCpp?: LlamaCppConfig;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitingConfig {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  /** Maximum requests per minute */
  maxRequestsPerMinute: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Whether to allow shell execution (should generally be false) */
  allowShellExecution?: boolean;
  /** Maximum prompt length in characters */
  maxPromptLength?: number;
  /** Maximum response length in characters */
  maxResponseLength?: number;
  /** Rate limiting configuration */
  rateLimiting?: RateLimitingConfig;
}

/**
 * Complete configuration structure
 */
export interface Config {
  /** Configuration version */
  version: '1.0';
  /** Server configuration */
  server: ServerConfig;
  /** Provider configurations */
  providers: ProvidersConfig;
  /** Security configuration */
  security: SecurityConfig;
}

/**
 * Configuration file discovery locations (in order of precedence)
 */
export const CONFIG_LOCATIONS = [
  // 1. CLI argument (handled separately)
  // 2. Environment variable
  'AI_ORCHESTRATION_CONFIG',
  // 3. Project-local config
  './config/ai-orchestration.json',
  // 4. User config directory
  '~/.config/ai-orchestration/config.json',
  // 5. Defaults (handled in code)
] as const;
