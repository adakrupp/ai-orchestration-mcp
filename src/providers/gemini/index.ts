/**
 * Gemini provider
 * Provides access to Google's Gemini via CLI
 */

import {
  BaseProvider,
  ProviderCapabilities,
  ProviderRequest,
  ProviderResponse,
} from '../../types/providers.js';
import { GeminiConfig } from '../../types/config.js';
import { GeminiClient } from './client.js';
import { InputSanitizer } from '../../execution/sanitizer.js';

/**
 * Gemini provider
 * Uses Gemini CLI for safe execution
 */
export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini';
  readonly capabilities: ProviderCapabilities = {
    supportsStreaming: false,
    supportsSystemPrompt: false, // Gemini CLI doesn't support system prompts easily
    supportsImages: true, // Gemini supports multimodal
    supportsFunctionCalling: false,
  };

  private client: GeminiClient;
  private defaultModel?: string;

  /**
   * Constructor
   * @param config Gemini configuration
   */
  constructor(config: GeminiConfig) {
    super(config);

    const cliPath = config.cliPath || 'gemini';
    this.client = new GeminiClient(cliPath, this.getTimeout());
    this.defaultModel = config.defaultModel;
  }

  /**
   * List available models
   * @returns Array of model names
   */
  async listModels(): Promise<string[]> {
    // Gemini CLI doesn't provide a list command
    // Return known models
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
    ];
  }

  /**
   * Execute a request
   * @param request The request to execute
   * @returns The response
   */
  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    // Validate and sanitize inputs
    const prompt = InputSanitizer.validatePrompt(request.prompt);

    // Gemini CLI doesn't support system prompts, so we prepend it to the prompt if provided
    const fullPrompt = request.system
      ? `${request.system}\n\n${prompt}`
      : prompt;

    // Use provided model or default
    const model = request.model || this.defaultModel;

    // Validate model
    const availableModels = await this.listModels();
    if (model) {
      InputSanitizer.validateModel(model, availableModels);
    }

    // Execute request
    const startTime = Date.now();

    const responseText = await this.client.generate(fullPrompt, model);

    const duration = Date.now() - startTime;

    return {
      text: responseText,
      model: model || 'gemini-2.0-flash-exp',
      usage: {
        // Gemini CLI doesn't provide token counts
        totalTokens: undefined,
      },
      metadata: {
        duration,
      },
    };
  }

  /**
   * Validate provider configuration
   * @returns True if configuration is valid and CLI is accessible
   */
  async validateConfig(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch {
      return false;
    }
  }
}
