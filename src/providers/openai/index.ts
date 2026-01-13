/**
 * OpenAI provider
 * Provides access to OpenAI models via the official SDK
 */

import {
  BaseProvider,
  ProviderCapabilities,
  ProviderRequest,
  ProviderResponse,
} from '../../types/providers.js';
import { OpenAIConfig } from '../../types/config.js';
import { OpenAIClient } from './client.js';
import { InputSanitizer } from '../../execution/sanitizer.js';
import { ConfigurationError } from '../../utils/errors.js';

/**
 * OpenAI provider
 * Uses the official OpenAI SDK
 */
export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';
  readonly capabilities: ProviderCapabilities = {
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsImages: true, // GPT-4 Vision models support images
    supportsFunctionCalling: true,
  };

  private client: OpenAIClient;
  private defaultModel?: string;

  /**
   * Constructor
   * @param config OpenAI configuration
   */
  constructor(config: OpenAIConfig) {
    super(config);

    // Get API key from config or environment
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ConfigurationError(
        'OpenAI API key not provided. Set it in config or OPENAI_API_KEY environment variable.'
      );
    }

    this.client = new OpenAIClient(apiKey, {
      baseUrl: config.baseUrl,
      organization: config.organization,
      timeout: this.getTimeout(),
    });

    this.defaultModel = config.defaultModel || 'gpt-4o-mini';
  }

  /**
   * List available models
   * @returns Array of model IDs
   */
  async listModels(): Promise<string[]> {
    return await this.client.listModels();
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
    const maxTokens = InputSanitizer.validateMaxTokens(request.maxTokens);

    // Use provided model or default
    const model = request.model || this.defaultModel!;

    // Execute request
    const startTime = Date.now();

    const result = await this.client.generate(model, prompt, system, temperature, maxTokens);

    const duration = Date.now() - startTime;

    return {
      text: result.text,
      model,
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens,
          }
        : undefined,
      metadata: {
        duration,
      },
    };
  }

  /**
   * Validate provider configuration
   * @returns True if configuration is valid and API key works
   */
  async validateConfig(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch {
      return false;
    }
  }
}
