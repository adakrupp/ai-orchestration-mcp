/**
 * Ollama provider
 * Provides access to local Ollama models via HTTP API
 */

import {
  BaseProvider,
  ProviderCapabilities,
  ProviderRequest,
  ProviderResponse,
} from '../../types/providers.js';
import { OllamaConfig } from '../../types/config.js';
import { OllamaClient } from './client.js';
import { InputSanitizer } from '../../execution/sanitizer.js';

/**
 * Ollama provider
 * Uses HTTP API for safe communication with Ollama server
 */
export class OllamaProvider extends BaseProvider {
  readonly name = 'ollama';
  readonly capabilities: ProviderCapabilities = {
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsImages: false,
    supportsFunctionCalling: false,
  };

  private client: OllamaClient;
  private modelAliases: Record<string, string>;

  /**
   * Constructor
   * @param config Ollama configuration
   */
  constructor(config: OllamaConfig) {
    super(config);

    const baseUrl = config.baseUrl || 'http://localhost:11434';
    this.client = new OllamaClient(baseUrl, this.getTimeout());
    this.modelAliases = config.models || {};
  }

  /**
   * List available models
   * @returns Array of model names (including aliases)
   */
  async listModels(): Promise<string[]> {
    const models = await this.client.listModels();

    // Add aliases if they exist
    const aliases = Object.keys(this.modelAliases);

    return [...models, ...aliases];
  }

  /**
   * Execute a request
   * @param request The request to execute
   * @returns The response
   */
  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    // Validate and sanitize inputs
    const prompt = InputSanitizer.validatePrompt(request.prompt);
    const system = InputSanitizer.validateSystem(request.system);
    const temperature = InputSanitizer.validateTemperature(request.temperature);

    // Resolve model alias if applicable
    const model = this.resolveModel(request.model);

    // Validate model
    const availableModels = await this.listModels();
    InputSanitizer.validateModel(model, availableModels);

    // Execute request
    const startTime = Date.now();

    const responseText = await this.client.generate({
      model,
      prompt,
      system,
      options: {
        temperature,
        num_predict: request.maxTokens,
      },
    });

    const duration = Date.now() - startTime;

    return {
      text: responseText,
      model,
      usage: {
        // Ollama doesn't provide token counts in non-streaming mode
        totalTokens: undefined,
      },
      metadata: {
        duration,
      },
    };
  }

  /**
   * Validate provider configuration
   * @returns True if configuration is valid and server is accessible
   */
  async validateConfig(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Resolve model alias to actual model name
   * @param modelOrAlias Model name or alias
   * @returns Resolved model name
   */
  private resolveModel(modelOrAlias: string): string {
    return this.modelAliases[modelOrAlias] || modelOrAlias;
  }
}
