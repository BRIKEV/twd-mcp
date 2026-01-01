# TWD MCP

MCP (Model Context Protocol) server for generating TWD tests from browser recordings.

## Overview

This MCP server enables AI assistants (Cursor, Claude Desktop) to generate TWD tests from browser recordings. It works in conjunction with browser MCPs (Playwright MCP, Chrome MCP) to capture user interactions and automatically generate test code.

## Architecture

```
Browser MCP (captures) → AI (orchestrates) → TWD MCP (generates test code)
```

TWD MCP focuses only on **data transformation**—browser capture is handled by existing MCPs.

## Tools

### 1. `suggestSelectors`
Maps DOM elements to Testing Library selector suggestions. Prioritizes accessible selectors (role > label > text > placeholder > testid).

**Input:**
- `tagName` (required): HTML tag name
- `role`, `textContent`, `ariaLabel`, `placeholder`, `testId`, `name` (optional)

**Output:** Array of selector suggestions with priority

### 2. `generateMocksFromNetwork`
Generates TWD mock request handlers from captured network requests/responses.

**Input:**
- `requests`: Array of network requests with `url`, `method`, and `response` (with `status` and `body`)

**Output:** TWD mock handler code

### 3. `generateTestFromRecording`
Generates a complete TWD test file from browser recording data.

**Input:**
- `interactions`: Array of user interactions (click, type, navigate)
- `networkCalls` (optional): Array of network requests to mock
- `testName` (optional): Name for the test

**Output:** Complete TWD test file code

## Installation

```bash
npm install
npm run build
```

## Testing the MCP Server

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

### Method 1: Test with MCP Inspector (Recommended)

1. Install MCP Inspector globally:
```bash
npm install -g @modelcontextprotocol/inspector
```

2. Run the inspector:
```bash
mcp-inspector npx twd-mcp
```

This will open a web interface where you can test all three tools interactively.

### Method 2: Test via Cursor/Claude Desktop

1. Add the MCP server to your Cursor settings (`~/.cursor/mcp.json` or similar):
```json
{
  "mcpServers": {
    "twd-mcp": {
      "command": "npx",
      "args": ["twd-mcp"]
    }
  }
}
```

2. Restart Cursor/Claude Desktop

3. Test by asking:
   - "Suggest selectors for a button element with text 'Submit'"
   - "Generate mocks from these network requests: [paste JSON]"
   - "Generate a test from these interactions: [paste JSON]"

### Method 3: Manual Testing with JSON-RPC

You can test the server directly using JSON-RPC over stdio:

```bash
# Test suggestSelectors
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"suggestSelectors","arguments":{"tagName":"button","textContent":"Submit"}}}' | npx twd-mcp

# Test generateMocksFromNetwork
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generateMocksFromNetwork","arguments":{"requests":[{"url":"https://api.example.com/users","method":"GET","response":{"status":200,"body":{"users":[]}}}]}}}' | npx twd-mcp

# Test generateTestFromRecording
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"generateTestFromRecording","arguments":{"interactions":[{"type":"navigate","target":{"tagName":"div"},"url":"https://example.com"},{"type":"click","target":{"tagName":"button","textContent":"Login"}}],"testName":"Login flow"}}}' | npx twd-mcp
```

### Method 4: Unit Testing (Manual Verification)

Create a test script to verify the tools work correctly:

```bash
# Create a test file
cat > test-manual.js << 'EOF'
import { suggestSelectors } from './dist/tools/suggestSelectors.js';
import { generateMocksFromNetwork } from './dist/tools/generateMocksFromNetwork.js';
import { generateTestFromRecording } from './dist/tools/generateTestFromRecording.js';

// Test suggestSelectors
console.log('Testing suggestSelectors:');
const selectors = suggestSelectors({
  tagName: 'button',
  textContent: 'Submit Form',
  ariaLabel: 'Submit the form'
});
console.log(JSON.stringify(selectors, null, 2));
console.log('\n');

// Test generateMocksFromNetwork
console.log('Testing generateMocksFromNetwork:');
const mocks = generateMocksFromNetwork([{
  url: 'https://api.example.com/users',
  method: 'GET',
  response: { status: 200, body: { users: [] } }
}]);
console.log(mocks);
console.log('\n');

// Test generateTestFromRecording
console.log('Testing generateTestFromRecording:');
const test = generateTestFromRecording({
  interactions: [
    { type: 'navigate', target: { tagName: 'div' }, url: 'https://example.com' },
    { type: 'click', target: { tagName: 'button', textContent: 'Login' } },
    { type: 'type', target: { tagName: 'input', placeholder: 'Email' }, value: 'test@example.com' }
  ],
  testName: 'Login flow'
});
console.log(test);
EOF

# Run the test
node test-manual.js
```

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```

## Usage Example

In Cursor, you can prompt:
> "Record what I do in the browser and generate a TWD test"

The AI will:
1. Call Playwright MCP / Chrome MCP to capture DOM + interactions
2. Call TWD MCP `generateTestFromRecording` tool
3. Output the generated test file

## License

ISC
