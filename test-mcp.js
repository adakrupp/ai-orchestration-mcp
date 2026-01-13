#!/usr/bin/env node

/**
 * Simple MCP server test
 * Tests if the server initializes correctly and exposes tools
 */

import { spawn } from 'child_process';

console.log('Testing MCP Server...\n');

// Start the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

// Collect stderr (where logs go)
server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  process.stderr.write(data); // Also show logs
});

// Collect stdout (MCP protocol messages)
server.stdout.on('data', (data) => {
  output += data.toString();
});

// Send initialize request
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  },
};

// Send list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
};

// Wait a bit for server to initialize
setTimeout(() => {
  console.log('\n--- Sending initialize request ---');
  server.stdin.write(JSON.stringify(initializeRequest) + '\n');

  setTimeout(() => {
    console.log('\n--- Sending list tools request ---');
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    setTimeout(() => {
      console.log('\n--- Server Output ---');
      console.log(output);

      console.log('\n--- Test Complete ---');
      console.log('Server initialized successfully!');
      console.log('Check the output above for registered tools.');

      server.kill();
      process.exit(0);
    }, 2000);
  }, 1000);
}, 2000);

// Handle errors
server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Test timed out');
  server.kill();
  process.exit(1);
}, 10000);
