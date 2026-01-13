#!/bin/bash

# Docker Setup Script for AI Orchestration MCP
# Sets up the environment and pulls required Ollama models

set -e

echo "==================================="
echo "AI Orchestration MCP - Docker Setup"
echo "==================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

echo "✅ Docker is installed"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p config
echo "✅ Directories created"
echo ""

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created (please edit it with your API keys)"
    echo ""
fi

# Copy Docker configuration if ai-orchestration.json doesn't exist
if [ ! -f config/ai-orchestration.json ]; then
    echo "📝 Creating configuration file..."
    cp config/docker.ai-orchestration.json config/ai-orchestration.json
    echo "✅ Configuration file created"
    echo ""
fi

# Build the MCP server image
echo "🔨 Building MCP server image..."
$COMPOSE_CMD build ai-orchestration-mcp
echo "✅ MCP server image built"
echo ""

# Start Ollama service
echo "🚀 Starting Ollama service..."
$COMPOSE_CMD up -d ollama
echo "✅ Ollama service started"
echo ""

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Check if Ollama is healthy
for i in {1..30}; do
    if docker exec ai-orchestration-ollama ollama list &> /dev/null; then
        echo "✅ Ollama is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Ollama failed to start"
        exit 1
    fi
    sleep 2
done
echo ""

# Pull Ollama models
echo "📥 Pulling Ollama models..."
echo "This may take a while depending on your internet connection..."
echo ""

echo "Pulling qwen2.5:7b..."
docker exec ai-orchestration-ollama ollama pull qwen2.5:7b

echo ""
echo "Pulling qwen2.5-coder:7b..."
docker exec ai-orchestration-ollama ollama pull qwen2.5-coder:7b

echo ""
echo "✅ Models pulled successfully"
echo ""

echo "==================================="
echo "✅ Setup Complete!"
echo "==================================="
echo ""
echo "To start the MCP server:"
echo "  $COMPOSE_CMD up -d ai-orchestration-mcp"
echo ""
echo "To view logs:"
echo "  $COMPOSE_CMD logs -f ai-orchestration-mcp"
echo ""
echo "To stop all services:"
echo "  $COMPOSE_CMD down"
echo ""
echo "To test the server:"
echo "  docker exec -i ai-orchestration-mcp node dist/index.js < test-input.json"
echo ""
