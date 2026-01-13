/**
 * Safe command execution utilities
 * Provides safe subprocess execution WITHOUT shell interpolation
 */

import { spawn } from 'child_process';
import { ProviderError } from '../utils/errors.js';

/**
 * Options for command execution
 */
export interface ExecutorOptions {
  /** Input to write to stdin */
  input?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Maximum buffer size for stdout/stderr */
  maxBuffer?: number;
  /** Environment variables */
  env?: Record<string, string>;
  /** Working directory */
  cwd?: string;
}

/**
 * Result of command execution
 */
export interface ExecutorResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
}

/**
 * Safe command executor
 * CRITICAL: Never uses shell=true, preventing command injection
 */
export class CommandExecutor {
  /**
   * Execute a command safely using spawn
   * @param command The command to execute (e.g., "ollama")
   * @param args Array of arguments (e.g., ["run", "model-name"])
   * @param options Execution options
   * @returns The execution result
   * @throws ProviderError if execution fails
   */
  static async executeSafe(
    command: string,
    args: string[],
    options: ExecutorOptions = {}
  ): Promise<ExecutorResult> {
    const {
      input,
      timeout = 120000, // 2 minutes default
      maxBuffer = 10 * 1024 * 1024, // 10MB default
      env = {},
      cwd,
    } = options;

    return new Promise((resolve, reject) => {
      // CRITICAL: shell: false prevents command injection
      const child = spawn(command, args, {
        shell: false, // NEVER set this to true
        env: { ...process.env, ...env },
        cwd,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');

        // If still running after 5 seconds, force kill
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Handle stdout
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();

        // Prevent buffer overflow
        if (stdout.length > maxBuffer) {
          child.kill('SIGTERM');
          reject(
            new ProviderError(`Output exceeded maximum buffer size of ${maxBuffer} bytes`)
          );
        }
      });

      // Handle stderr
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();

        // Prevent buffer overflow
        if (stderr.length > maxBuffer) {
          child.kill('SIGTERM');
          reject(
            new ProviderError(`Error output exceeded maximum buffer size of ${maxBuffer} bytes`)
          );
        }
      });

      // Handle errors
      child.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        reject(
          new ProviderError(`Failed to execute command: ${error.message}`)
        );
      });

      // Handle process exit
      child.on('close', (code: number | null) => {
        clearTimeout(timeoutId);

        if (timedOut) {
          reject(
            new ProviderError(`Command timed out after ${timeout}ms`)
          );
          return;
        }

        resolve({
          stdout,
          stderr,
          exitCode: code ?? -1,
        });
      });

      // Write input to stdin if provided
      if (input !== undefined) {
        try {
          child.stdin.write(input);
          child.stdin.end();
        } catch (error) {
          clearTimeout(timeoutId);
          reject(
            new ProviderError(
              `Failed to write to stdin: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      }
    });
  }

  /**
   * Execute a command and return only stdout
   * Convenience method that throws if exit code is non-zero
   * @param command The command to execute
   * @param args Array of arguments
   * @param options Execution options
   * @returns The stdout output
   * @throws ProviderError if execution fails or exit code is non-zero
   */
  static async executeAndGetOutput(
    command: string,
    args: string[],
    options: ExecutorOptions = {}
  ): Promise<string> {
    const result = await this.executeSafe(command, args, options);

    if (result.exitCode !== 0) {
      throw new ProviderError(
        `Command failed with exit code ${result.exitCode}: ${result.stderr || result.stdout}`
      );
    }

    return result.stdout;
  }
}
