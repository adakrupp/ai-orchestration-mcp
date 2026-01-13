/**
 * llama.cpp HTTP client
 * Communicates with llama.cpp server via HTTP API
 */

import { NetworkError, TimeoutError, ProviderError } from '../../utils/errors.js';

/**
 * llama.cpp completion request
 */
export interface LlamaCppRequest {
  prompt: string;
  temperature?: number;
  n_predict?: number; // max tokens
  stop?: string[];
  stream?: boolean;
}

/**
 * llama.cpp completion response
 */
export interface LlamaCppResponse {
  content: string;
  generation_settings?: {
    model?: string;
    n_predict?: number;
    temperature?: number;
  };
  timings?: {
    predicted_ms?: number;
    predicted_n?: number;
    prompt_ms?: number;
    prompt_n?: number;
  };
}

/**
 * llama.cpp HTTP client
 * Communicates with llama.cpp server
 */
export class LlamaCppClient {
  private baseUrl: string;
  private timeout: number;

  /**
   * Constructor
   * @param baseUrl llama.cpp server base URL (default: http://localhost:8080)
   * @param timeout Request timeout in milliseconds (default: 120000)
   */
  constructor(baseUrl: string = 'http://localhost:8080', timeout: number = 120000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Generate completion
   * @param request Completion request
   * @returns Generated text
   */
  async generate(request: LlamaCppRequest): Promise<string> {
    const url = `${this.baseUrl}/completion`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          temperature: request.temperature,
          n_predict: request.n_predict ?? 512,
          stream: false, // Always use non-streaming
          stop: request.stop,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new NetworkError(
          `llama.cpp API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          url
        );
      }

      const data: LlamaCppResponse = await response.json();

      if (!data.content) {
        throw new ProviderError('llama.cpp returned empty response', 'llamaCpp');
      }

      return data.content;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `llama.cpp request timed out after ${this.timeout}ms`,
          this.timeout
        );
      }

      if (error instanceof NetworkError || error instanceof ProviderError) {
        throw error;
      }

      throw new NetworkError(
        `Failed to connect to llama.cpp: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        url
      );
    }
  }

  /**
   * Test connection to llama.cpp server
   * @returns True if server is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a minimal request to test the server
      const url = `${this.baseUrl}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // If health endpoint doesn't exist, try a minimal completion
      try {
        await this.generate({
          prompt: 'test',
          n_predict: 1,
        });
        return true;
      } catch {
        return false;
      }
    }
  }
}
