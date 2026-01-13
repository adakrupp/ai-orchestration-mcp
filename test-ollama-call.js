#!/usr/bin/env node

/**
 * Test Ollama provider functionality
 * Sends a real request through the MCP server to Ollama
 */

import { spawn } from 'child_process';

console.log('Testing Ollama Provider...\n');

// Start the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let responses = [];

// Collect stderr (logs)
server.stderr.on('data', (data) => {
  process.stderr.write(data); // Show logs
});

// Collect stdout (MCP responses)
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      responses.push(response);
    } catch (e) {
      // Ignore non-JSON lines
    }
  }
});

// Test sequence
setTimeout(() => {
  console.log('\n--- Step 1: Initialize ---');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  setTimeout(() => {
    console.log('\n--- Step 2: List Models ---');
    const listRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'list_ollama_models',
        arguments: {},
      },
    };
    server.stdin.write(JSON.stringify(listRequest) + '\n');

    setTimeout(() => {
      console.log('\n--- Step 3: Test Simple Query ---');
      const testRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'use_ollama',
          arguments: {
            model: 'qwen2.5:7b',
            prompt: 'Say "Hello from Ollama!" and nothing else.',
          },
        },
      };
      server.stdin.write(JSON.stringify(testRequest) + '\n');

      setTimeout(() => {
        console.log('\n--- Results ---\n');

        // Find responses
        const initResponse = responses.find(r => r.id === 1);
        const listResponse = responses.find(r => r.id === 2);
        const testResponse = responses.find(r => r.id === 3);

        if (initResponse) {
          console.log('✅ Initialize:', initResponse.result.serverInfo.name);
        }

        if (listResponse) {
          console.log('✅ List Models:', listResponse.result.content[0].text);
        }

        if (testResponse) {
          if (testResponse.error) {
            console.log('❌ Test Query Failed:', testResponse.error.message);
          } else {
            console.log('✅ Test Query Response:', testResponse.result.content[0].text);
          }
        }

        console.log('\n--- Test Complete ---');
        server.kill();
        process.exit(0);
      }, 5000); // Give Ollama time to respond
    }, 1000);
  }, 1000);
}, 1000);

// Timeout
setTimeout(() => {
  console.error('Test timed out');
  server.kill();
  process.exit(1);
}, 15000);

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
