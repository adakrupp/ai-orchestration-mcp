# AI Orchestration MCP Server

Production-grade Model Context Protocol (MCP) server for orchestrating multiple AI providers. Intelligently delegate tasks to local models (Ollama, llama.cpp) or cloud providers (OpenAI, Anthropic, Gemini) to optimize cost and performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Docker Hub](https://img.shields.io/docker/v/adakrupp/ai-orchestration-mcp?label=Docker%20Hub)](https://hub.docker.com/r/adakrupp/ai-orchestration-mcp)
[![Docker Image Size](https://img.shields.io/docker/image-size/adakrupp/ai-orchestration-mcp/latest)](https://hub.docker.com/r/adakrupp/ai-orchestration-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/adakrupp/ai-orchestration-mcp)](https://hub.docker.com/r/adakrupp/ai-orchestration-mcp)

## ✨ Features

- 🔐 **Secure by Design**: No shell injection vulnerabilities - uses HTTP APIs and official SDKs
- 🔌 **5 AI Providers**: Ollama, Gemini, OpenAI, Anthropic, llama.cpp
- ⚙️ **Flexible Configuration**: File-based config with environment variable support
- 📊 **Comprehensive Logging**: Structured logging with sensitive data redaction
- 📝 **Request History**: Track all requests and responses in JSONL format
- 🐳 **Docker Ready**: One-command deployment with docker-compose
- 🔄 **Plugin Architecture**: Easily add new providers
- 🛡️ **Input Validation**: Comprehensive sanitization and validation
- 📦 **TypeScript**: Full type safety with strict mode

## 🚀 Quick Start

### Option 1: Docker Hub (Easiest)

```bash
# Pull the image
docker pull adakrupp/ai-orchestration-mcp:latest

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/adakrupp/ai-orchestration-mcp/main/docker-compose.yml

# Start services
docker compose up -d

# View logs
docker compose logs -f ai-orchestration-mcp
```

**That's it!** The server is now running with Ollama and ready to use with Claude Code.

### Option 2: Build from Source

```bash
# Clone repository
git clone https://github.com/adakrupp/ai-orchestration-mcp.git
cd ai-orchestration-mcp

# One-command setup
./docker-setup.sh

# View logs
docker compose logs -f ai-orchestration-mcp
```

👉 See [DOCKER.md](DOCKER.md) for complete Docker documentation.

### Option 3: Local Installation

```bash
# Clone and install
git clone https://github.com/adakrupp/ai-orchestration-mcp.git
cd ai-orchestration-mcp
npm install

# Build
npm run build

# Configure
cp config/ai-orchestration.example.json config/ai-orchestration.json
# Edit config/ai-orchestration.json with your settings

# Test
npm test
```

## 📖 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage with Claude Code](#usage-with-claude-code)
- [Providers](#providers)
- [Architecture](#architecture)
- [Development](#development)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 📦 Installation

### Prerequisites

- Node.js 18+ (or Docker)
- One or more AI providers:
  - **Ollama**: Install from [ollama.ai](https://ollama.ai)
  - **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
  - **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)
  - **Gemini**: Get API key from [ai.google.dev](https://ai.google.dev)
  - **llama.cpp**: Run [llama.cpp server](https://github.com/ggerganov/llama.cpp)

### Installation Methods

#### Docker Hub (Recommended)

```bash
docker pull adakrupp/ai-orchestration-mcp:latest
```

See [DOCKER.md](DOCKER.md) for complete Docker deployment guide.

#### Docker Build from Source

See [DOCKER.md](DOCKER.md) for building from source.

#### NPM Installation

```bash
# Install dependencies
npm install

# Install optional peer dependencies (as needed)
npm install openai @anthropic-ai/sdk

# Build TypeScript
npm run build
```

## ⚙️ Configuration

### Configuration File

Create `config/ai-orchestration.json`:

```json
{
  "version": "1.0",
  "server": {
    "name": "ai-orchestration-mcp",
    "version": "2.0.0",
    "logLevel": "info",
    "historyEnabled": true
  },
  "providers": {
    "ollama": {
      "enabled": true,
      "baseUrl": "http://localhost:11434",
      "models": {
        "coder": "qwen2.5-coder:7b",
        "general": "qwen2.5:7b"
      }
    },
    "openai": {
      "enabled": true,
      "apiKey": "${OPENAI_API_KEY}",
      "defaultModel": "gpt-4o-mini"
    }
  },
  "security": {
    "maxPromptLength": 100000,
    "maxResponseLength": 500000
  }
}
```

### Environment Variables

Create `.env` file:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### Configuration Discovery

The server searches for configuration in this order:

1. `--config` CLI argument
2. `AI_ORCHESTRATION_CONFIG` environment variable
3. `./config/ai-orchestration.json` (project directory)
4. `~/.config/ai-orchestration/config.json` (user config)
5. Built-in defaults

## 🎯 Usage with Claude Code

### Method 1: Docker

Update your `.mcp.json`:

```json
{
  "mcpServers": {
    "ai-orchestration": {
      "command": "docker",
      "args": ["exec", "-i", "ai-orchestration-mcp", "node", "dist/index.js"]
    }
  }
}
```

### Method 2: Local

```json
{
  "mcpServers": {
    "ai-orchestration": {
      "command": "node",
      "args": ["/absolute/path/to/ai-orchestration-mcp/dist/index.js"]
    }
  }
}
```

### Available Tools

Once configured, Claude Code will have access to these tools:

#### For each enabled provider:

- **`use_<provider>`**: Send a query to the provider
  ```
  use_ollama model="qwen2.5:7b" prompt="Explain async/await in JavaScript"
  ```

- **`list_<provider>_models`**: List available models
  ```
  list_ollama_models
  ```

### Example Usage

```
User: "Use Ollama to explain what a Docker container is"

Claude: I'll use the local Ollama model for this task.
[Calls use_ollama with qwen2.5:7b]

User: "Now use OpenAI to write production-grade documentation for it"

Claude: I'll use OpenAI for the comprehensive documentation.
[Calls use_openai with gpt-4o-mini]
```

## 🤖 Providers

### Ollama (Local Models)

**Best for**: Simple tasks, code analysis, quick questions

- ✅ Free (runs locally)
- ✅ Privacy (data stays local)
- ✅ Fast (low latency)
- ❌ Requires local resources
- ❌ Limited compared to cloud models

**Setup**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:7b
```

### OpenAI

**Best for**: Complex reasoning, production code, detailed analysis

- ✅ Powerful models (GPT-4, GPT-4o)
- ✅ Good for coding tasks
- ✅ Function calling support
- ❌ Costs per token
- ❌ Data sent to OpenAI

**Setup**:
```bash
npm install openai

# Add to .env
OPENAI_API_KEY=sk-...
```

### Anthropic (Claude)

**Best for**: Long context tasks, analysis, complex reasoning

- ✅ Large context windows (200k tokens)
- ✅ Strong reasoning capabilities
- ✅ Good safety guardrails
- ❌ Costs per token
- ❌ Data sent to Anthropic

**Setup**:
```bash
npm install @anthropic-ai/sdk

# Add to .env
ANTHROPIC_API_KEY=sk-ant-...
```

### Gemini

**Best for**: Multimodal tasks, web research, creative writing

- ✅ Multimodal (text + images)
- ✅ Free tier available
- ✅ Fast responses
- ❌ Less suitable for code
- ❌ Data sent to Google

**Setup**:
```bash
# Install Gemini CLI
# See: https://github.com/google/gemini-cli

# Add to .env
GEMINI_API_KEY=...
```

### llama.cpp (Local HTTP Server)

**Best for**: Custom local models, complete privacy

- ✅ Run any GGUF model
- ✅ Complete privacy
- ✅ Customizable
- ❌ Manual setup required
- ❌ Resource intensive

**Setup**:
```bash
# Run llama.cpp server
./server -m model.gguf --port 8080
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Claude Code (Client)          │
└──────────────┬──────────────────────┘
               │ MCP Protocol
               │ (stdio)
┌──────────────▼──────────────────────┐
│   AI Orchestration MCP Server       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Provider Registry         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────┐ ┌────────┐ ┌──────────┐  │
│  │Ollama│ │ OpenAI │ │Anthropic │  │
│  └──┬───┘ └───┬────┘ └────┬─────┘  │
└─────┼─────────┼───────────┼────────┘
      │         │           │
      ▼         ▼           ▼
   HTTP API  REST API   REST API
```

### Key Components

- **Server**: MCP protocol handler, routes requests to providers
- **Provider Registry**: Manages all AI providers
- **Providers**: Individual integrations (Ollama, OpenAI, etc.)
- **Config Loader**: Loads and validates configuration
- **Logger**: Structured logging with sensitive data redaction
- **History Tracker**: Records all requests/responses

### Security Features

- ✅ **No Shell Injection**: Uses HTTP APIs and spawn() without shell
- ✅ **Input Validation**: Comprehensive sanitization of all inputs
- ✅ **API Key Redaction**: Never logs sensitive credentials
- ✅ **Type Safety**: Full TypeScript with strict mode
- ✅ **Rate Limiting**: Optional rate limiting per provider
- ✅ **Max Length Limits**: Prevents oversized inputs/outputs

## 🛠️ Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run in dev mode (with auto-reload)
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:int

# Coverage report
npm run test:coverage
```

### Adding a New Provider

1. Create provider directory:
   ```
   src/providers/myprovider/
   ├── index.ts      # Provider implementation
   └── client.ts     # API client
   ```

2. Implement BaseProvider:
   ```typescript
   export class MyProvider extends BaseProvider {
     readonly name = 'myprovider';
     readonly capabilities = { /* ... */ };

     async listModels(): Promise<string[]> { /* ... */ }
     async execute(request: ProviderRequest): Promise<ProviderResponse> { /* ... */ }
     async validateConfig(): Promise<boolean> { /* ... */ }
   }
   ```

3. Register in `src/index.ts`:
   ```typescript
   if (config.providers.myprovider?.enabled) {
     const provider = new MyProvider(config.providers.myprovider);
     registry.register(provider);
   }
   ```

4. Add configuration types in `src/types/config.ts`

5. Add tests in `tests/unit/providers/myprovider.test.ts`

## 🔒 Security

### Reporting Vulnerabilities

Please report security vulnerabilities to [security@example.com](mailto:security@example.com).

### Security Best Practices

1. **API Keys**: Store in environment variables, never commit
2. **Configuration**: Use `.gitignore` to exclude config files
3. **Updates**: Keep dependencies up to date (`npm audit`)
4. **Logs**: Review logs for sensitive data exposure
5. **Rate Limiting**: Enable for production deployments

### Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests
5. Run tests and linting (`npm test && npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MCP Protocol](https://modelcontextprotocol.io/) by Anthropic
- [Ollama](https://ollama.ai/) for local model serving
- [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Google](https://ai.google.dev/) for their APIs
- All contributors to this project

## 📚 Additional Documentation

- [Docker Deployment Guide](DOCKER.md)
- [Configuration Reference](CONFIGURATION.md) *(coming soon)*
- [Provider Documentation](PROVIDERS.md) *(coming soon)*
- [Development Guide](DEVELOPMENT.md) *(coming soon)*
- [Security Policy](SECURITY.md) *(coming soon)*

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/adakrupp/ai-orchestration-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/adakrupp/ai-orchestration-mcp/discussions)
- **Documentation**: [Full Docs](https://github.com/adakrupp/ai-orchestration-mcp/tree/main/docs)

---

**Made with ❤️ for the AI community**
