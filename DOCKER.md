# Docker Deployment Guide

This guide explains how to deploy the AI Orchestration MCP Server using Docker.

## 🐳 Docker Hub

The easiest way to get started is to pull the pre-built image from Docker Hub:

```bash
docker pull adakrupp/ai-orchestration-mcp:latest
```

**Available Tags**:
- `latest` - Latest stable version
- `2.0.0` - Specific version (v2.0.0)
- `2.0` - Major.minor version
- `2` - Major version

**Docker Hub Repository**: [adakrupp/ai-orchestration-mcp](https://hub.docker.com/r/adakrupp/ai-orchestration-mcp)

---

## Quick Start

### Option 1: Docker Hub (Fastest)

```bash
# Pull image
docker pull adakrupp/ai-orchestration-mcp:latest

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/adakrupp/ai-orchestration-mcp/main/docker-compose.yml

# Modify docker-compose.yml to use Docker Hub image
# (Uncomment the 'image:' line and comment out the 'build:' section)

# Start services
docker compose up -d

# View logs
docker compose logs -f ai-orchestration-mcp
```

### Option 2: Build from Source

#### 1. One-Command Setup

Run the setup script to build images, start services, and pull Ollama models:

```bash
# Clone repository
git clone https://github.com/adakrupp/ai-orchestration-mcp.git
cd ai-orchestration-mcp

# Run setup script
./docker-setup.sh
```

This will:
- ✅ Build the MCP server Docker image
- ✅ Start Ollama service
- ✅ Pull required models (qwen2.5:7b, qwen2.5-coder:7b)
- ✅ Create necessary directories and config files

#### 2. Start the MCP Server

```bash
docker compose up -d ai-orchestration-mcp
```

#### 3. View Logs

```bash
docker compose logs -f ai-orchestration-mcp
```

#### 4. Stop Services

```bash
docker compose down
```

---

## Manual Setup

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (or docker-compose 1.29+)
- (Optional) NVIDIA GPU + nvidia-docker for GPU acceleration

### Step 1: Configuration

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your API keys:**
   ```bash
   nano .env
   ```

   Add your keys:
   ```env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GEMINI_API_KEY=...
   ```

3. **Copy configuration file:**
   ```bash
   cp config/docker.ai-orchestration.json config/ai-orchestration.json
   ```

4. **Edit configuration** (optional):
   ```bash
   nano config/ai-orchestration.json
   ```

### Step 2: Build and Start

```bash
# Build the MCP server image
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Step 3: Pull Ollama Models

If using Ollama, pull the models you need:

```bash
# Pull models
docker exec ai-orchestration-ollama ollama pull qwen2.5:7b
docker exec ai-orchestration-ollama ollama pull qwen2.5-coder:7b

# List available models
docker exec ai-orchestration-ollama ollama list
```

---

## Architecture

### Services

The docker-compose setup includes:

1. **ai-orchestration-mcp**: The main MCP server
   - Exposes MCP protocol via stdin/stdout
   - Connects to AI providers
   - Logs to `/app/logs`

2. **ollama** (optional): Local Ollama server
   - Runs models locally
   - Accessible at `http://ollama:11434` (internal)
   - Exposed on `http://localhost:11434` (host)
   - Models stored in Docker volume

### Volumes

- **ollama-models**: Persistent storage for Ollama models (~4-8GB per model)
- **ai-orchestration-history**: Request/response history
- **./logs**: Log files (mounted from host)
- **./config**: Configuration file (mounted read-only)

### Network

All services run on the `ai-orchestration-net` bridge network.

---

## Configuration

### Environment Variables

Set in `.env` file or pass via docker-compose:

```yaml
environment:
  - OPENAI_API_KEY=sk-...
  - ANTHROPIC_API_KEY=sk-ant-...
  - GEMINI_API_KEY=...
  - AI_ORCHESTRATION_CONFIG=/app/config/ai-orchestration.json
```

### Configuration File

The config file at `config/ai-orchestration.json` is mounted into the container.

**Key differences for Docker:**
- Ollama URL: `http://ollama:11434` (service name)
- Log paths: `/app/logs/...` (container paths)
- History path: `/app/history/...` (persistent volume)

---

## Using Pre-built Image

To use the Docker Hub image instead of building locally, modify `docker-compose.yml`:

```yaml
services:
  # AI Orchestration MCP Server
  ai-orchestration-mcp:
    # Option 1: Use pre-built image from Docker Hub
    image: adakrupp/ai-orchestration-mcp:latest

    # Option 2: Build from source (comment out when using Docker Hub image)
    # build:
    #   context: .
    #   dockerfile: Dockerfile

    container_name: ai-orchestration-mcp
    restart: unless-stopped
    # ... rest of configuration
```

After modifying, start the services:

```bash
docker compose up -d
```

---

## GPU Support (Optional)

### NVIDIA GPU

To use GPU acceleration with Ollama:

1. Install [nvidia-docker](https://github.com/NVIDIA/nvidia-docker)

2. Uncomment GPU section in `docker-compose.yml`:
   ```yaml
   ollama:
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```

3. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

---

## Usage with Claude Code

### Option 1: Docker Exec (Recommended)

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

**Note**: Container must be running before starting Claude Code.

### Option 2: Docker Run (On-Demand)

```json
{
  "mcpServers": {
    "ai-orchestration": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--network", "ai-orchestration-mcp_ai-orchestration-net",
        "ai-orchestration-mcp:latest"
      ]
    }
  }
}
```

---

## Troubleshooting

### Check Service Status

```bash
docker compose ps
```

### View Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs ai-orchestration-mcp
docker compose logs ollama

# Follow logs
docker compose logs -f ai-orchestration-mcp
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart ai-orchestration-mcp
```

### Ollama Not Responding

```bash
# Check Ollama health
docker exec ai-orchestration-ollama ollama list

# Restart Ollama
docker compose restart ollama

# Check Ollama logs
docker compose logs ollama
```

### MCP Server Not Starting

1. Check configuration:
   ```bash
   cat config/ai-orchestration.json
   ```

2. Check environment variables:
   ```bash
   docker compose config
   ```

3. Check logs:
   ```bash
   docker compose logs ai-orchestration-mcp
   ```

4. Test manually:
   ```bash
   docker run -it --rm \
     -v $(pwd)/config:/app/config:ro \
     ai-orchestration-mcp:latest
   ```

### Clean Start

Remove everything and start fresh:

```bash
# Stop and remove containers
docker compose down

# Remove volumes (WARNING: deletes Ollama models!)
docker compose down -v

# Remove images
docker compose down --rmi all

# Rebuild and start
./docker-setup.sh
```

---

## Production Deployment

### Security Best Practices

1. **Use Secrets Management**:
   ```yaml
   # Use Docker secrets instead of environment variables
   secrets:
     openai_key:
       file: ./secrets/openai_key.txt
   ```

2. **Read-Only Filesystem**:
   ```yaml
   ai-orchestration-mcp:
     read_only: true
     tmpfs:
       - /tmp
   ```

3. **Resource Limits**:
   ```yaml
   ai-orchestration-mcp:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 4G
   ```

4. **Security Options**:
   ```yaml
   security_opt:
     - no-new-privileges:true
   cap_drop:
     - ALL
   ```

### Monitoring

Add health checks and monitoring:

```yaml
ai-orchestration-mcp:
  healthcheck:
    test: ["CMD", "node", "-e", "process.exit(0)"]
    interval: 30s
    timeout: 3s
    retries: 3
```

---

## Advanced Usage

### Custom Models

Add custom Ollama models:

```bash
# Pull model
docker exec ai-orchestration-ollama ollama pull llama3:8b

# Update config
nano config/ai-orchestration.json
```

Add to models section:
```json
"models": {
  "llama": "llama3:8b"
}
```

### Multiple Providers

Enable additional providers in `config/ai-orchestration.json`:

```json
"openai": {
  "enabled": true,
  "apiKey": "${OPENAI_API_KEY}",
  "defaultModel": "gpt-4o-mini"
}
```

Set API key in `.env`:
```env
OPENAI_API_KEY=sk-...
```

Restart:
```bash
docker compose restart ai-orchestration-mcp
```

---

## Updating

### Update MCP Server

```bash
# Pull latest code
git pull

# Rebuild image
docker compose build ai-orchestration-mcp

# Restart service
docker compose up -d ai-orchestration-mcp
```

### Update Ollama

```bash
# Pull latest Ollama image
docker compose pull ollama

# Restart Ollama
docker compose up -d ollama
```

---

## Backup and Restore

### Backup

```bash
# Backup configuration
cp config/ai-orchestration.json config/ai-orchestration.json.backup

# Backup Ollama models (export volume)
docker run --rm -v ai-orchestration-mcp_ollama-models:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/ollama-models.tar.gz -C /data .

# Backup history
docker run --rm -v ai-orchestration-mcp_ai-orchestration-history:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/history.tar.gz -C /data .
```

### Restore

```bash
# Restore Ollama models
docker run --rm -v ai-orchestration-mcp_ollama-models:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/ollama-models.tar.gz -C /data

# Restore history
docker run --rm -v ai-orchestration-mcp_ai-orchestration-history:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/history.tar.gz -C /data
```

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Ollama Docker Guide](https://hub.docker.com/r/ollama/ollama)
- [Project README](README.md)
- [Configuration Guide](CONFIGURATION.md)
