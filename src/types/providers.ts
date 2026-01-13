/**
 * Provider type definitions
 * Defines interfaces and types for AI provider integrations
 */

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retries for failed requests */
  maxRetries?: number;
  /** Provider-specific environment variables */
  env?: Record<string, string>;
  /** Additional provider-specific configuration */
  [key: string]: unknown;
}

/**
 * Request to a provider
 */
export interface ProviderRequest {
  /** Model identifier to use */
  model: string;
  /** The prompt/question to send */
  prompt: string;
  /** Optional system prompt to guide behavior */
  system?: string;
  /** Temperature for response generation (0.0 to 1.0) */
  temperature?: number;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Response from a provider
 */
export interface ProviderResponse {
  /** The generated text */
  text: string;
  /** The model that was used */
  model: string;
  /** Token usage information */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /** Supports streaming responses */
  supportsStreaming: boolean;
  /** Supports system prompts */
  supportsSystemPrompt: boolean;
  /** Supports image inputs */
  supportsImages: boolean;
  /** Supports function calling */
  supportsFunctionCalling: boolean;
}

/**
 * Model information
 */
export interface ModelInfo {
  /** Model identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Model description */
  description?: string;
  /** Whether this model is recommended for the provider */
  recommended?: boolean;
}

/**
 * Base provider abstract class
 * All providers must extend this class
 */
export abstract class BaseProvider {
  /** Provider name (e.g., "ollama", "openai") */
  abstract readonly name: string;

  /** Provider capabilities */
  abstract readonly capabilities: ProviderCapabilities;

  /**
   * Constructor
   * @param config Provider configuration
   */
  constructor(protected config: ProviderConfig) {}

  /**
   * List available models from this provider
   * @returns Array of model identifiers
   */
  abstract listModels(): Promise<string[]>;

  /**
   * Execute a request to the provider
   * @param request The request to execute
   * @returns The response from the provider
   */
  abstract execute(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Validate the provider configuration
   * @returns True if configuration is valid and provider is accessible
   */
  abstract validateConfig(): Promise<boolean>;

  /**
   * Sanitize user input to prevent injection attacks
   * @param input The input to sanitize
   * @returns Sanitized input
   */
  protected sanitizeInput(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Limit length (basic protection)
    const maxLength = 100000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Get the timeout for requests
   * @returns Timeout in milliseconds
   */
  protected getTimeout(): number {
    return this.config.timeout ?? 120000; // Default 2 minutes
  }

  /**
   * Check if the provider is enabled
   * @returns True if enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
