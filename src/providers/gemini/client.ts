/**
 * Gemini client
 * Safe implementation using spawn instead of shell
 */

import { CommandExecutor } from '../../execution/executor.js';
import { ProviderError } from '../../utils/errors.js';

/**
 * Gemini client
 * Executes Gemini CLI safely using spawn
 */
export class GeminiClient {
  private cliPath: string;
  private timeout: number;

  /**
   * Constructor
   * @param cliPath Path to Gemini CLI (default: 'gemini')
   * @param timeout Request timeout in milliseconds
   */
  constructor(cliPath: string = 'gemini', timeout: number = 60000) {
    this.cliPath = cliPath;
    this.timeout = timeout;
  }

  /**
   * Generate text using Gemini
   * @param prompt The prompt to send
   * @param model Optional model to use
   * @returns Generated text
   */
  async generate(prompt: string, model?: string): Promise<string> {
    const args: string[] = [];

    if (model) {
      args.push('--model', model);
    }

    try {
      const output = await CommandExecutor.executeAndGetOutput(this.cliPath, args, {
        input: prompt,
        timeout: this.timeout,
      });

      return output.trim();
    } catch (error) {
      throw new ProviderError(
        `Gemini generation failed: ${error instanceof Error ? error.message : String(error)}`,
        'gemini'
      );
    }
  }

  /**
   * Test connection to Gemini
   * @returns True if Gemini CLI is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to execute gemini --version or similar
      await CommandExecutor.executeSafe(this.cliPath, ['--version'], {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}
