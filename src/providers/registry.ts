/**
 * Provider registry
 * Manages all AI provider instances
 */

import { BaseProvider } from '../types/providers.js';
import { Logger } from '../logging/logger.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Provider registry
 * Central registry for all providers
 */
export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();
  private logger?: Logger;

  /**
   * Constructor
   * @param logger Optional logger instance
   */
  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Register a provider
   * @param provider Provider instance to register
   */
  register(provider: BaseProvider): void {
    if (!provider.isEnabled()) {
      this.logger?.debug(`Provider ${provider.name} is disabled, skipping registration`);
      return;
    }

    this.providers.set(provider.name, provider);
    this.logger?.info(`Registered provider: ${provider.name}`);
  }

  /**
   * Get a provider by name
   * @param name Provider name
   * @returns Provider instance or undefined if not found
   */
  getProvider(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   * @returns Array of all providers
   */
  getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all provider names
   * @returns Array of provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   * @param name Provider name
   * @returns True if provider is registered
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get count of registered providers
   * @returns Number of registered providers
   */
  getCount(): number {
    return this.providers.size;
  }

  /**
   * Initialize all providers
   * Validates configuration and connectivity for all registered providers
   * @returns Map of provider names to validation results
   */
  async initializeAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, provider] of this.providers.entries()) {
      try {
        this.logger?.debug(`Validating provider: ${name}`);
        const isValid = await provider.validateConfig();
        results.set(name, isValid);

        if (isValid) {
          this.logger?.info(`Provider ${name} initialized successfully`);
        } else {
          this.logger?.warn(`Provider ${name} validation failed`);
        }
      } catch (error) {
        this.logger?.error(`Provider ${name} initialization failed`, { error });
        results.set(name, false);
      }
    }

    return results;
  }

  /**
   * Generate MCP tools for all registered providers
   * @returns Array of MCP tool definitions
   */
  async generateMCPTools(): Promise<Tool[]> {
    const tools: Tool[] = [];

    for (const provider of this.providers.values()) {
      // Generate use_<provider> tool
      const models = await provider.listModels().catch(() => [] as string[]);

      tools.push({
        name: `use_${provider.name}`,
        description: this.getProviderDescription(provider),
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: `Model to use from ${provider.name}`,
              ...(models.length > 0 ? { enum: models } : {}),
            },
            prompt: {
              type: 'string',
              description: 'The prompt/question to send to the model',
            },
            ...(provider.capabilities.supportsSystemPrompt
            ? {
                system: {
                  type: 'string',
                  description: 'Optional system prompt to guide the model\'s behavior',
                },
              }
            : {}),
            temperature: {
              type: 'number',
              description: 'Temperature for response generation (0.0 to 2.0)',
            },
          },
          required: ['model', 'prompt'],
        },
      });

      // Generate list_<provider>_models tool
      tools.push({
        name: `list_${provider.name}_models`,
        description: `List all available ${provider.name} models`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      });
    }

    return tools;
  }

  /**
   * Get provider description for MCP tool
   * @param provider Provider instance
   * @returns Description string
   */
  private getProviderDescription(provider: BaseProvider): string {
    const capabilities: string[] = [];

    if (provider.capabilities.supportsStreaming) {
      capabilities.push('streaming');
    }
    if (provider.capabilities.supportsSystemPrompt) {
      capabilities.push('system prompts');
    }
    if (provider.capabilities.supportsImages) {
      capabilities.push('images');
    }
    if (provider.capabilities.supportsFunctionCalling) {
      capabilities.push('function calling');
    }

    const capabilitiesStr =
      capabilities.length > 0 ? ` Supports: ${capabilities.join(', ')}.` : '';

    return `Use ${provider.name} for AI tasks.${capabilitiesStr} This helps manage token usage by delegating tasks to different providers.`;
  }
}
