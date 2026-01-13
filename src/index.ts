#!/usr/bin/env node

/**
 * AI Orchestration MCP Server
 * Entry point - initializes and starts the server
 */

import { ConfigLoader } from './config/loader.js';
import { Logger } from './logging/logger.js';
import { HistoryTracker } from './logging/history.js';
import { ProviderRegistry } from './providers/registry.js';
import { MCPServer } from './server.js';

// Import providers
import { OllamaProvider } from './providers/ollama/index.js';
import { GeminiProvider } from './providers/gemini/index.js';
import { OpenAIProvider } from './providers/openai/index.js';
import { AnthropicProvider } from './providers/anthropic/index.js';
import { LlamaCppProvider } from './providers/llama-cpp/index.js';

/**
 * Main function
 * Initializes and starts the MCP server
 */
async function main() {
  try {
    // Load configuration
    const configLoader = new ConfigLoader();
    const config = await configLoader.load();

    // Initialize logger
    const logger = new Logger(config.server);
    logger.info('Starting AI Orchestration MCP Server');
    logger.debug('Configuration loaded', { config: sanitizeConfig(config) });

    // Initialize history tracker
    const history = new HistoryTracker(config.server);

    // Initialize provider registry
    const registry = new ProviderRegistry(logger);

    // Register providers based on configuration
    if (config.providers.ollama?.enabled) {
      try {
        const provider = new OllamaProvider(config.providers.ollama);
        registry.register(provider);
        logger.info('Ollama provider registered');
      } catch (error) {
        logger.error('Failed to register Ollama provider', { error });
      }
    }

    if (config.providers.gemini?.enabled) {
      try {
        const provider = new GeminiProvider(config.providers.gemini);
        registry.register(provider);
        logger.info('Gemini provider registered');
      } catch (error) {
        logger.error('Failed to register Gemini provider', { error });
      }
    }

    if (config.providers.openai?.enabled) {
      try {
        const provider = new OpenAIProvider(config.providers.openai);
        registry.register(provider);
        logger.info('OpenAI provider registered');
      } catch (error) {
        logger.error('Failed to register OpenAI provider', { error });
      }
    }

    if (config.providers.anthropic?.enabled) {
      try {
        const provider = new AnthropicProvider(config.providers.anthropic);
        registry.register(provider);
        logger.info('Anthropic provider registered');
      } catch (error) {
        logger.error('Failed to register Anthropic provider', { error });
      }
    }

    if (config.providers.llamaCpp?.enabled) {
      try {
        const provider = new LlamaCppProvider(config.providers.llamaCpp);
        registry.register(provider);
        logger.info('LlamaCpp provider registered');
      } catch (error) {
        logger.error('Failed to register LlamaCpp provider', { error });
      }
    }

    // Check if any providers are registered
    if (registry.getCount() === 0) {
      logger.warn('No providers are enabled. Please enable at least one provider in configuration.');
      logger.warn('Server will start but no tools will be available.');
    }

    // Initialize all providers
    logger.info('Initializing providers...');
    const initResults = await registry.initializeAll();

    let successCount = 0;
    let failCount = 0;

    for (const [name, success] of initResults.entries()) {
      if (success) {
        successCount++;
        logger.info(`Provider ${name} initialized successfully`);
      } else {
        failCount++;
        logger.warn(`Provider ${name} failed to initialize`);
      }
    }

    logger.info(`Provider initialization complete: ${successCount} succeeded, ${failCount} failed`);

    // Create and start MCP server
    const server = new MCPServer(config, registry, logger, history);
    await server.start();

    logger.info('Server is ready to accept requests');
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

/**
 * Sanitize configuration for logging
 * Removes sensitive data like API keys
 * @param config Configuration to sanitize
 * @returns Sanitized configuration
 */
function sanitizeConfig(config: any): any {
  const sanitized = JSON.parse(JSON.stringify(config));

  // Remove API keys
  if (sanitized.providers) {
    for (const provider of Object.values(sanitized.providers)) {
      if (provider && typeof provider === 'object' && 'apiKey' in provider) {
        (provider as any).apiKey = '***REDACTED***';
      }
    }
  }

  return sanitized;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
