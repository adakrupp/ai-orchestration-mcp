/**
 * Type declarations for optional peer dependencies
 * These modules are dynamically imported and may not be installed
 */

// Declare openai module (peer dependency)
declare module 'openai' {
  export default class OpenAI {
    constructor(config: any);
    chat: {
      completions: {
        create(params: any): Promise<any>;
      };
    };
    models: {
      list(): Promise<any>;
    };
  }
}

// Declare @anthropic-ai/sdk module (peer dependency)
declare module '@anthropic-ai/sdk' {
  export default class Anthropic {
    constructor(config: any);
    messages: {
      create(params: any): Promise<any>;
    };
  }
}
