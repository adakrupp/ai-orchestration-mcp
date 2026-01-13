/**
 * Default configuration values
 * Provides sensible defaults for all configuration options
 */

import { Config } from '../types/config.js';

/**
 * Default configuration
 * Used when no configuration file is found or for missing values
 */
export const DEFAULT_CONFIG: Config = {
  version: '1.0',

  server: {
    name: 'ai-orchestration-mcp',
    version: '2.0.0',
    logLevel: 'info',
    historyEnabled: false,
    historyMaxEntries: 1000,
  },

  providers: {
    ollama: {
      enabled: false,
      baseUrl: 'http://localhost:11434',
      timeout: 120000,
    },
    gemini: {
      enabled: false,
      timeout: 60000,
    },
    openai: {
      enabled: false,
      timeout: 60000,
    },
    anthropic: {
      enabled: false,
      timeout: 60000,
    },
    llamaCpp: {
      enabled: false,
      baseUrl: 'http://localhost:8080',
      timeout: 120000,
    },
  },

  security: {
    allowShellExecution: false,
    maxPromptLength: 100000,
    maxResponseLength: 500000,
    rateLimiting: {
      enabled: false,
      maxRequestsPerMinute: 60,
    },
  },
};
