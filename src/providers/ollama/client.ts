/**
 * Ollama HTTP API client
 * Safe implementation using HTTP API instead of CLI
 */

import { NetworkError, TimeoutError, ProviderError } from '../../utils/errors.js';

/**
 * Ollama generate request
 */
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

/**
 * Ollama generate response
 */
export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama model info
 */
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
  };
}

/**
 * Ollama models list response
 */
export interface OllamaModelsResponse {
  models: OllamaModel[];
}

/**
 * Ollama HTTP client
 * Communicates with Ollama server via HTTP API
 */
export class OllamaClient {
  private baseUrl: string;
  private timeout: number;

  /**
   * Constructor
   * @param baseUrl Ollama server base URL (default: http://localhost:11434)
   * @param timeout Request timeout in milliseconds (default: 120000)
   */
  constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 120000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Generate text using a model
   * @param request Generate request
   * @returns Generated text
   */
  async generate(request: OllamaGenerateRequest): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          system: request.system,
          stream: false, // Always use non-streaming for simplicity
          options: request.options,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new NetworkError(
          `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          url
        );
      }

      const data: OllamaGenerateResponse = await response.json();

      if (!data.response) {
        throw new ProviderError('Ollama returned empty response', 'ollama');
      }

      return data.response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `Ollama request timed out after ${this.timeout}ms`,
          this.timeout
        );
      }

      if (error instanceof NetworkError || error instanceof ProviderError) {
        throw error;
      }

      throw new NetworkError(
        `Failed to connect to Ollama: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        url
      );
    }
  }

  /**
   * List available models
   * @returns Array of model names
   */
  async listModels(): Promise<string[]> {
    const url = `${this.baseUrl}/api/tags`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for list

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(
          `Ollama API error: ${response.status} ${response.statusText}`,
          response.status,
          url
        );
      }

      const data: OllamaModelsResponse = await response.json();

      return data.models.map((model) => model.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError('Ollama list models request timed out', 10000);
      }

      if (error instanceof NetworkError) {
        throw error;
      }

      throw new NetworkError(
        `Failed to list Ollama models: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        url
      );
    }
  }

  /**
   * Test connection to Ollama server
   * @returns True if server is accessible
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
