/**
 * Configuration loader
 * Discovers and loads configuration from multiple sources
 */

import { readFile, access } from 'fs/promises';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { Config } from '../types/config.js';
import { ConfigurationError } from '../utils/errors.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { validateConfig } from './validator.js';

/**
 * Configuration loader
 * Handles configuration file discovery and loading
 */
export class ConfigLoader {
  private configPath?: string;

  /**
   * Constructor
   * @param configPath Optional explicit config file path
   */
  constructor(configPath?: string) {
    this.configPath = configPath;
  }

  /**
   * Load configuration
   * Tries multiple sources in order of precedence:
   * 1. Explicit config path (constructor or CLI arg)
   * 2. Environment variable: AI_ORCHESTRATION_CONFIG
   * 3. Project config: ./config/ai-orchestration.json
   * 4. User config: ~/.config/ai-orchestration/config.json
   * 5. Defaults
   *
   * @returns The loaded and validated configuration
   */
  async load(): Promise<Config> {
    // Try to find config file
    const configPath = await this.findConfigFile();

    if (configPath) {
      try {
        const raw = await readFile(configPath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Expand environment variables in config
        const expanded = this.expandEnvVars(parsed);

        // Validate and merge with defaults
        const validated = validateConfig(expanded);
        return this.mergeWithDefaults(validated);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new ConfigurationError(
            `Failed to parse config file ${configPath}: ${error.message}`
          );
        }
        throw new ConfigurationError(
          `Failed to load config file ${configPath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // No config file found, use defaults
    return DEFAULT_CONFIG;
  }

  /**
   * Find configuration file
   * @returns Path to config file, or undefined if not found
   */
  private async findConfigFile(): Promise<string | undefined> {
    const candidates: string[] = [];

    // 1. Explicit config path
    if (this.configPath) {
      candidates.push(resolve(this.configPath));
    }

    // 2. Environment variable
    const envConfigPath = process.env.AI_ORCHESTRATION_CONFIG;
    if (envConfigPath) {
      candidates.push(resolve(envConfigPath));
    }

    // 3. Project-local config
    candidates.push(resolve('./config/ai-orchestration.json'));

    // 4. User config directory
    const userConfigDir = join(homedir(), '.config', 'ai-orchestration');
    candidates.push(join(userConfigDir, 'config.json'));

    // Check each candidate
    for (const path of candidates) {
      if (await this.fileExists(path)) {
        return path;
      }
    }

    return undefined;
  }

  /**
   * Check if a file exists
   * @param path File path to check
   * @returns True if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expand environment variables in configuration
   * Replaces ${ENV_VAR} with the value of ENV_VAR
   * @param obj The object to expand
   * @returns Object with expanded environment variables
   */
  private expandEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      // Match ${VAR_NAME} pattern
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          throw new ConfigurationError(
            `Environment variable ${varName} is not defined`
          );
        }
        return value;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.expandEnvVars(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.expandEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Merge configuration with defaults
   * Ensures all required fields have values
   * @param config Partial configuration
   * @returns Complete configuration
   */
  private mergeWithDefaults(config: Config): Config {
    return {
      version: config.version,
      server: {
        ...DEFAULT_CONFIG.server,
        ...config.server,
      },
      providers: {
        ollama: config.providers.ollama
          ? { ...DEFAULT_CONFIG.providers.ollama, ...config.providers.ollama }
          : DEFAULT_CONFIG.providers.ollama,
        gemini: config.providers.gemini
          ? { ...DEFAULT_CONFIG.providers.gemini, ...config.providers.gemini }
          : DEFAULT_CONFIG.providers.gemini,
        openai: config.providers.openai
          ? { ...DEFAULT_CONFIG.providers.openai, ...config.providers.openai }
          : DEFAULT_CONFIG.providers.openai,
        anthropic: config.providers.anthropic
          ? { ...DEFAULT_CONFIG.providers.anthropic, ...config.providers.anthropic }
          : DEFAULT_CONFIG.providers.anthropic,
        llamaCpp: config.providers.llamaCpp
          ? { ...DEFAULT_CONFIG.providers.llamaCpp, ...config.providers.llamaCpp }
          : DEFAULT_CONFIG.providers.llamaCpp,
      },
      security: {
        ...DEFAULT_CONFIG.security,
        ...config.security,
        rateLimiting: config.security.rateLimiting
          ? { ...DEFAULT_CONFIG.security.rateLimiting, ...config.security.rateLimiting }
          : DEFAULT_CONFIG.security.rateLimiting,
      },
    };
  }
}
