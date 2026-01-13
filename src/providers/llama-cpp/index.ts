/**
 * llama.cpp provider
 * Provides access to local llama.cpp server
 */

import {
  BaseProvider,
  ProviderCapabilities,
  ProviderRequest,
  ProviderResponse,
} from '../../types/providers.js';
import { LlamaCppConfig } from '../../types/config.js';
import { LlamaCppClient } from './client.js';
import { InputSanitizer } from '../../execution/sanitizer.js';

/**
 * llama.cpp provider
 * Uses HTTP API for communication with llama.cpp server
 */
export class LlamaCppProvider extends BaseProvider {
  readonly name = 'llamaCpp';
  readonly capabilities: ProviderCapabilities = {
    supportsStreaming: true,
    supportsSystemPrompt: false, // llama.cpp doesn't have built-in system prompt support
    supportsImages: false,
    supportsFunctionCalling: false,
  };

  private client: LlamaCppClient;

  /**
   * Constructor
   * @param config llama.cpp configuration
   */
  constructor(config: LlamaCppConfig) {
    super(config);

    const baseUrl = config.baseUrl || 'http://localhost:8080';
    this.client = new LlamaCppClient(baseUrl, this.getTimeout());
  }

  /**
   * List available models
   * @returns Array with single model (llama.cpp serves one model at a time)
   */
  async listModels(): Promise<string[]> {
    // llama.cpp serves one model at a time
    // Return a generic model name
    return ['llama-cpp-model'];
  }

  /**
   * Execute a request
   * @param request The request to execute
   * @returns The response
   */
  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    // Validate and sanitize inputs
    const prompt = InputSanitizer.validatePrompt(request.prompt);
    const temperature = InputSanitizer.validateTemperature(request.temperature);
    const maxTokens = InputSanitizer.validateMaxTokens(request.maxTokens);

    // llama.cpp doesn't support system prompts natively
    // Prepend system prompt to user prompt if provided
    const fullPrompt = request.system
      ? `${request.system}\n\n${prompt}`
      : prompt;

    // Execute request
    const startTime = Date.now();

    const responseText = await this.client.generate({
      prompt: fullPrompt,
      temperature,
      n_predict: maxTokens,
    });

    const duration = Date.now() - startTime;

    return {
      text: responseText,
      model: request.model || 'llama-cpp-model',
      usage: {
        // llama.cpp provides timing info but not token counts in completion endpoint
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
}
