/**
 * OpenAI client wrapper
 * Wraps the OpenAI SDK for use in the provider
 */

import { ProviderError, AuthenticationError } from '../../utils/errors.js';

// Dynamic import to handle optional dependency
type OpenAI = any;

/**
 * OpenAI client
 * Wraps the official OpenAI SDK
 */
export class OpenAIClient {
  private client: OpenAI | null = null;
  private apiKey: string;
  private baseUrl?: string;
  private organization?: string;
  private timeout: number;

  /**
   * Constructor
   * @param apiKey OpenAI API key
   * @param options Optional configuration
   */
  constructor(
    apiKey: string,
    options: {
      baseUrl?: string;
      organization?: string;
      timeout?: number;
    } = {}
  ) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl;
    this.organization = options.organization;
    this.timeout = options.timeout || 60000;
  }

  /**
   * Initialize the OpenAI client
   * Lazy initialization to handle optional dependency
   */
  private async ensureClient(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      // Dynamic import of the OpenAI SDK
      const { default: OpenAI } = await import('openai');

      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
        organization: this.organization,
        timeout: this.timeout,
      });
    } catch (error) {
      throw new ProviderError(
        `OpenAI SDK not installed. Install it with: npm install openai`,
        'openai'
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
      throw new ProviderError('OpenAI client not initialized', 'openai');
    }

    try {
      const messages: any[] = [];

      if (system) {
        messages.push({ role: 'system', content: system });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const text = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return { text, usage };
    } catch (error: any) {
      if (error.status === 401) {
        throw new AuthenticationError('Invalid OpenAI API key', 'openai');
      }

      throw new ProviderError(
        `OpenAI API error: ${error.message || String(error)}`,
        'openai',
        error.status
      );
    }
  }

  /**
   * List available models
   * @returns Array of model IDs
   */
  async listModels(): Promise<string[]> {
    await this.ensureClient();

    if (!this.client) {
      throw new ProviderError('OpenAI client not initialized', 'openai');
    }

    try {
      const response = await this.client.models.list();
      return response.data.map((model: any) => model.id);
    } catch (error: any) {
      // If listing fails, return common models
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ];
    }
  }

  /**
   * Test connection to OpenAI
   * @returns True if API key is valid
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}
