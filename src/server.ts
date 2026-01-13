/**
 * MCP Server
 * Handles MCP protocol requests and routes them to providers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { Config } from './types/config.js';
import { ProviderRegistry } from './providers/registry.js';
import { Logger } from './logging/logger.js';
import { HistoryTracker } from './logging/history.js';
import { ProviderRequest } from './types/providers.js';

/**
 * MCP Server
 * Integrates providers, logging, and history tracking with MCP protocol
 */
export class MCPServer {
  private server: Server;
  private registry: ProviderRegistry;
  private logger: Logger;
  private history: HistoryTracker;

  /**
   * Constructor
   * @param config Server configuration
   * @param registry Provider registry
   * @param logger Logger instance
   * @param history History tracker
   */
  constructor(
    config: Config,
    registry: ProviderRegistry,
    logger: Logger,
    history: HistoryTracker
  ) {
    this.registry = registry;
    this.logger = logger;
    this.history = history;

    // Create MCP server
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up request handlers
    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing available tools');

      const tools = await this.registry.generateMCPTools();

      this.logger.debug(`Returning ${tools.length} tools`);

      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info(`Tool called: ${name}`, { args: this.sanitizeArgs(args) });

      try {
        // Parse tool name to determine provider and action
        const { provider, action } = this.parseToolName(name);

        if (action === 'list') {
          return await this.handleListModels(provider);
        } else if (action === 'use') {
          return await this.handleUse(provider, args as any);
        } else {
          throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.error(`Tool execution failed: ${name}`, { error: errorMessage });

        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle list models request
   * @param providerName Provider name
   * @returns MCP response with model list
   */
  private async handleListModels(providerName: string) {
    const provider = this.registry.getProvider(providerName);

    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    const models = await provider.listModels();

    return {
      content: [
        {
          type: 'text',
          text: models.join('\n'),
        },
      ],
    };
  }

  /**
   * Handle use provider request
   * @param providerName Provider name
   * @param args Request arguments
   * @returns MCP response with generated text
   */
  private async handleUse(
    providerName: string,
    args: {
      model: string;
      prompt: string;
      system?: string;
      temperature?: number;
    }
  ) {
    const provider = this.registry.getProvider(providerName);

    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    const request: ProviderRequest = {
      model: args.model,
      prompt: args.prompt,
      system: args.system,
      temperature: args.temperature,
    };

    // Execute request and track timing
    const startTime = Date.now();
    let response;
    let error;

    try {
      response = await provider.execute(request);
      this.logger.info(`Provider ${providerName} executed successfully`, {
        model: args.model,
        duration: Date.now() - startTime,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Provider ${providerName} execution failed`, {
        error: error,
        model: args.model,
      });
      throw err;
    } finally {
      // Record to history
      const historyEntry = HistoryTracker.createEntry(
        providerName,
        args.model,
        { prompt: args.prompt, system: args.system },
        response ? { text: response.text, usage: response.usage } : undefined,
        error,
        Date.now() - startTime
      );

      await this.history.record(historyEntry);
    }

    return {
      content: [
        {
          type: 'text',
          text: response!.text,
        },
      ],
    };
  }

  /**
   * Parse tool name to extract provider and action
   * @param toolName Tool name (e.g., "use_ollama", "list_ollama_models")
   * @returns Provider name and action
   */
  private parseToolName(toolName: string): { provider: string; action: 'use' | 'list' } {
    if (toolName.startsWith('use_')) {
      const provider = toolName.substring(4); // Remove "use_"
      return { provider, action: 'use' };
    } else if (toolName.startsWith('list_') && toolName.endsWith('_models')) {
      const provider = toolName.substring(5, toolName.length - 7); // Remove "list_" and "_models"
      return { provider, action: 'list' };
    } else {
      throw new Error(`Invalid tool name format: ${toolName}`);
    }
  }

  /**
   * Sanitize arguments for logging (remove sensitive data)
   * @param args Arguments to sanitize
   * @returns Sanitized arguments
   */
  private sanitizeArgs(args: any): any {
    if (!args || typeof args !== 'object') {
      return args;
    }

    const sanitized = { ...args };

    // Truncate long prompts for logging
    if (sanitized.prompt && typeof sanitized.prompt === 'string') {
      if (sanitized.prompt.length > 100) {
        sanitized.prompt = sanitized.prompt.substring(0, 100) + '...';
      }
    }

    return sanitized;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP server started successfully');
  }
}
