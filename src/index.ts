#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { suggestSelectors } from './tools/suggestSelectors.js';
import { generateMocksFromNetwork } from './tools/generateMocksFromNetwork.js';
import { generateTestFromRecording } from './tools/generateTestFromRecording.js';
import {
  SuggestSelectorsInputSchema,
  GenerateMocksFromNetworkInputSchema,
  GenerateTestFromRecordingInputSchema,
} from './schemas.js';

const server = new Server(
  {
    name: 'twd-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'suggestSelectors',
        description:
          'Suggest testing-library selectors for a DOM element. Prioritizes accessible selectors (role > label > text > placeholder > testid).',
        inputSchema: {
          type: 'object',
          properties: {
            tagName: {
              type: 'string',
              description: 'The HTML tag name (e.g., "button", "input", "div")',
            },
            role: {
              type: 'string',
              description: 'The ARIA role attribute',
            },
            textContent: {
              type: 'string',
              description: 'Visible text content inside the element',
            },
            ariaLabel: {
              type: 'string',
              description: 'The aria-label attribute',
            },
            placeholder: {
              type: 'string',
              description: 'The placeholder attribute (for inputs)',
            },
            testId: {
              type: 'string',
              description: 'The data-testid attribute',
            },
            name: {
              type: 'string',
              description: 'The name attribute (for form elements)',
            },
          },
          required: ['tagName'],
        },
      },
      {
        name: 'generateMocksFromNetwork',
        description:
          'Generate TWD mock request handlers from captured network requests/responses.',
        inputSchema: {
          type: 'object',
          properties: {
            requests: {
              type: 'array',
              description: 'Array of captured network requests',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'The request URL',
                  },
                  method: {
                    type: 'string',
                    description: 'The HTTP method (GET, POST, etc.)',
                  },
                  response: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'number',
                        description: 'HTTP status code',
                      },
                      body: {
                        description: 'Response body (can be any JSON-serializable value)',
                      },
                    },
                    required: ['body'],
                  },
                },
                required: ['url', 'method', 'response'],
              },
            },
          },
          required: ['requests'],
        },
      },
      {
        name: 'generateTestFromRecording',
        description:
          'Generate a complete TWD test file from browser recording data (interactions and optional network calls).',
        inputSchema: {
          type: 'object',
          properties: {
            interactions: {
              type: 'array',
              description: 'Array of user interactions captured from browser',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['click', 'type', 'navigate'],
                    description: 'The type of user interaction',
                  },
                  target: {
                    type: 'object',
                    description: 'The target element for the interaction',
                    properties: {
                      tagName: { type: 'string' },
                      role: { type: 'string' },
                      textContent: { type: 'string' },
                      ariaLabel: { type: 'string' },
                      placeholder: { type: 'string' },
                      testId: { type: 'string' },
                      name: { type: 'string' },
                    },
                    required: ['tagName'],
                  },
                  value: {
                    type: 'string',
                    description: 'The text content for "type" events',
                  },
                  url: {
                    type: 'string',
                    description: 'The URL for "navigate" events',
                  },
                  timestamp: {
                    type: 'number',
                    description: 'Timestamp of the interaction',
                  },
                },
                required: ['type', 'target'],
              },
            },
            networkCalls: {
              type: 'array',
              description: 'Optional array of network requests to mock',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  method: { type: 'string' },
                  response: {
                    type: 'object',
                    properties: {
                      status: { type: 'number' },
                      body: {},
                    },
                    required: ['body'],
                  },
                },
                required: ['url', 'method', 'response'],
              },
            },
            testName: {
              type: 'string',
              description: 'Name for the generated test (defaults to "recorded user flow")',
            },
          },
          required: ['interactions'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'suggestSelectors': {
        const validatedInput = SuggestSelectorsInputSchema.parse(args);
        const suggestions = suggestSelectors(validatedInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(suggestions, null, 2),
            },
          ],
        };
      }

      case 'generateMocksFromNetwork': {
        const validatedInput = GenerateMocksFromNetworkInputSchema.parse(args);
        const mockCode = generateMocksFromNetwork(validatedInput.requests);
        return {
          content: [
            {
              type: 'text',
              text: mockCode,
            },
          ],
        };
      }

      case 'generateTestFromRecording': {
        const validatedInput = GenerateTestFromRecordingInputSchema.parse(args);
        const testCode = generateTestFromRecording({
          interactions: validatedInput.interactions,
          networkCalls: validatedInput.networkCalls,
          testName: validatedInput.testName,
        });
        return {
          content: [
            {
              type: 'text',
              text: testCode,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TWD MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

