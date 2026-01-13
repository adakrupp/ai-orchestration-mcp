/**
 * Request/response history tracker
 * Stores request and response history in JSONL format
 */

import { appendFile, readFile, writeFile } from 'fs/promises';
import { ServerConfig } from '../types/config.js';

/**
 * History entry
 * Represents a single request/response pair
 */
export interface HistoryEntry {
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Provider name */
  provider: string;
  /** Model used */
  model: string;
  /** Request data */
  request: {
    prompt: string;
    system?: string;
    parameters?: any;
  };
  /** Response data */
  response?: {
    text: string;
    usage?: any;
    duration: number;
  };
  /** Error if request failed */
  error?: string;
}

/**
 * History tracker
 * Manages request/response history
 */
export class HistoryTracker {
  private entries: HistoryEntry[] = [];
  private maxEntries: number;
  private historyFile?: string;
  private enabled: boolean;

  /**
   * Constructor
   * @param config Server configuration
   */
  constructor(config: ServerConfig) {
    this.enabled = config.historyEnabled;
    this.maxEntries = config.historyMaxEntries ?? 1000;
    this.historyFile = config.historyFile;

    if (this.enabled && this.historyFile) {
      // Load existing history
      this.loadFromFile().catch((error) => {
        // Ignore errors on initial load (file might not exist)
        console.error('Failed to load history file:', error);
      });
    }
  }

  /**
   * Record a history entry
   * @param entry The entry to record
   */
  async record(entry: HistoryEntry): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Add to in-memory cache
    this.entries.push(entry);

    // Trim to max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Append to file if configured
    if (this.historyFile) {
      await this.appendToFile(entry);
    }
  }

  /**
   * Get recent history entries
   * @param count Number of entries to return (default: 10)
   * @returns Recent history entries
   */
  getRecent(count: number = 10): HistoryEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Get all history entries
   * @returns All history entries
   */
  getAll(): HistoryEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all history
   */
  async clear(): Promise<void> {
    this.entries = [];

    if (this.historyFile) {
      await writeFile(this.historyFile, '', 'utf-8');
    }
  }

  /**
   * Get total number of entries
   * @returns Total entry count
   */
  getCount(): number {
    return this.entries.length;
  }

  /**
   * Load history from file
   */
  private async loadFromFile(): Promise<void> {
    if (!this.historyFile) {
      return;
    }

    try {
      const content = await readFile(this.historyFile, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      this.entries = lines
        .map((line) => {
          try {
            return JSON.parse(line) as HistoryEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is HistoryEntry => entry !== null)
        .slice(-this.maxEntries); // Keep only last N entries
    } catch (error) {
      // File doesn't exist or is empty, that's okay
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Append entry to history file (JSONL format)
   * @param entry The entry to append
   */
  private async appendToFile(entry: HistoryEntry): Promise<void> {
    if (!this.historyFile) {
      return;
    }

    const line = JSON.stringify(entry) + '\n';
    await appendFile(this.historyFile, line, 'utf-8');
  }

  /**
   * Create a history entry from request/response
   * @param provider Provider name
   * @param model Model name
   * @param request Request data
   * @param response Response data (undefined if error)
   * @param error Error message (undefined if success)
   * @param duration Request duration in milliseconds
   * @returns History entry
   */
  static createEntry(
    provider: string,
    model: string,
    request: { prompt: string; system?: string; parameters?: any },
    response: { text: string; usage?: any } | undefined,
    error: string | undefined,
    duration: number
  ): HistoryEntry {
    return {
      timestamp: new Date().toISOString(),
      provider,
      model,
      request,
      response: response ? { ...response, duration } : undefined,
      error,
    };
  }
}
