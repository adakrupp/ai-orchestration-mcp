#!/usr/bin/env node

// Simple test to verify the MCP server is working
import { spawn } from 'child_process';

console.log('Testing MCP server...\n');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send a tools/list request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(request) + '\n');

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      if (response.result && response.result.tools) {
        console.log('✓ MCP server is working!');
        console.log('\nAvailable tools:');
        response.result.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description.substring(0, 80)}...`);
        });
        server.kill();
        process.exit(0);
      }
    } catch (e) {
      // Ignore non-JSON output
    }
  });
});

setTimeout(() => {
  console.error('✗ Test timed out');
  server.kill();
  process.exit(1);
}, 5000);
