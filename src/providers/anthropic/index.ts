/**
 * Anthropic provider
 * Provides access to Claude models via the official SDK
 */

import {
  BaseProvider,
  ProviderCapabilities,
  ProviderRequest,
  ProviderResponse,
} from '../../types/providers.js';
import { AnthropicConfig } from '../../types/config.js';
import { AnthropicClient } from './client.js';
import { InputSanitizer } from '../../execution/sanitizer.js';
import { ConfigurationError } from '../../utils/errors.js';

/**
 * Anthropic provider
 * Uses the official Anthropic SDK
 */
export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';
  readonly capabilities: ProviderCapabilities = {
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsImages: true, // Claude models support images
    supportsFunctionCalling: true, // Claude supports tool use
  };

  private client: AnthropicClient;
  private defaultModel?: string;

  /**
   * Constructor
   * @param config Anthropic configuration
   */
  constructor(config: AnthropicConfig) {
    super(config);

    // Get API key from config or environment
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new ConfigurationError(
        'Anthropic API key not provided. Set it in config or ANTHROPIC_API_KEY environment variable.'
      );
    }

    this.client = new AnthropicClient(apiKey, this.getTimeout());
    this.defaultModel = config.defaultModel || 'claude-3-5-haiku-20241022';
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
            promptTokens: result.usage.input_tokens,
            completionTokens: result.usage.output_tokens,
            totalTokens:
              (result.usage.input_tokens || 0) + (result.usage.output_tokens || 0),
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
