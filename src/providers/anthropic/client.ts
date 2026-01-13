/**
 * Anthropic client wrapper
 * Wraps the Anthropic SDK for use in the provider
 */

import { ProviderError, AuthenticationError } from '../../utils/errors.js';

// Dynamic import to handle optional dependency
type Anthropic = any;

/**
 * Anthropic client
 * Wraps the official Anthropic SDK
 */
export class AnthropicClient {
  private client: Anthropic | null = null;
  private apiKey: string;
  private timeout: number;

  /**
   * Constructor
   * @param apiKey Anthropic API key
   * @param timeout Request timeout in milliseconds
   */
  constructor(apiKey: string, timeout: number = 60000) {
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Initialize the Anthropic client
   * Lazy initialization to handle optional dependency
   */
  private async ensureClient(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      // Dynamic import of the Anthropic SDK
      const { default: Anthropic } = await import('@anthropic-ai/sdk');

      this.client = new Anthropic({
        apiKey: this.apiKey,
        timeout: this.timeout,
      });
    } catch (error) {
      throw new ProviderError(
        `Anthropic SDK not installed. Install it with: npm install @anthropic-ai/sdk`,
        'anthropic'
      );
    }
  }

  /**
   * Generate completion
   * @param model Model to use
   * @param prompt User prompt
   * @param system Optional system prompt
   * @param temperature Optional temperature
   * @param maxTokens Optional max tokens
   * @returns Generated text and usage info
   */
  async generate(
    model: string,
    prompt: string,
    system?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<{ text: string; usage: any }> {
    await this.ensureClient();

    if (!this.client) {
      throw new ProviderError('Anthropic client not initialized', 'anthropic');
    }

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        ...(system ? { system } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
      });

      const text = response.content[0]?.text || '';
      const usage = response.usage;

      return { text, usage };
    } catch (error: any) {
      if (error.status === 401) {
        throw new AuthenticationError('Invalid Anthropic API key', 'anthropic');
      }

      throw new ProviderError(
        `Anthropic API error: ${error.message || String(error)}`,
        'anthropic',
        error.status
      );
    }
  }

  /**
   * List available models
   * @returns Array of model IDs
   */
  async listModels(): Promise<string[]> {
    // Anthropic doesn't provide a models list endpoint
    // Return known Claude models
    return [
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
    ];
  }

  /**
   * Test connection to Anthropic
   * @returns True if API key is valid
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureClient();
      // Try a minimal request to validate the API key
      await this.generate('claude-3-5-haiku-20241022', 'test', undefined, undefined, 1);
      return true;
    } catch {
      return false;
    }
  }
}
