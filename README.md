# TWD MCP

MCP (Model Context Protocol) server for generating TWD tests from browser automation data.

## Overview

This MCP server enables AI assistants (Cursor, Claude Desktop) to generate TWD tests from browser automation sessions. It works in conjunction with **Playwright MCP** to execute browser actions programmatically and automatically generate test code.

## Architecture

```
Playwright MCP (captures) → AI (orchestrates) → TWD MCP (generates test code)
```

TWD MCP focuses only on **data transformation**—browser capture is handled by Playwright MCP. We focus on Playwright MCP because:
- **Semantic alignment**: Playwright uses accessibility tree snapshots that map perfectly to TWD's `screenDom` (Testing Library) approach
- **Structured data**: Playwright provides clean, structured interaction data ideal for code generation
- **Cross-browser**: Works across Chromium, Firefox, and WebKit
- **Test-focused**: Built specifically for automation and testing scenarios

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

### Method 2: Test via Cursor/Claude Desktop (Recommended for Real Testing)

1. Add both Playwright MCP and TWD MCP to your Cursor settings.

   **For Cursor**: Edit `~/.cursor/mcp.json` (create if it doesn't exist)
   
   **For Claude Desktop**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

   You can reference `mcp.json.example` in this repo for the exact format. Add both servers:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "twd-mcp": {
      "command": "npx",
      "args": ["twd-mcp@1.0.0"]
    }
  }
}
```

   **Version Options for `twd-mcp`:**
   - `"twd-mcp@1.0.0"` - Pin to specific version (recommended for stability)
   - `"twd-mcp@^1.0.0"` - Allow patch and minor updates (1.0.1, 1.1.0, but not 2.0.0)
   - `"twd-mcp@latest"` - Always use latest version (may break with major updates)
   - `"twd-mcp"` - Uses latest, but npx caching may delay updates

   **Note**: If you already have other MCP servers configured (like `chrome-devtools`), just add `playwright` and `twd-mcp` to the existing `mcpServers` object.

2. Restart Cursor/Claude Desktop

3. Test the integration by asking:
   - "Use Playwright to navigate to example.com and click the login button, then generate a TWD test from that"
   - "Use Playwright to automate navigating to my app, clicking the login button, and filling the form, then generate a TWD test"
   - Or test individual tools:
     - "Suggest selectors for a button element with text 'Submit'"
     - "Generate mocks from these network requests: [paste JSON]"
     - "Generate a test from these interactions: [paste JSON]"

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```

## Usage Example

In Cursor (with both Playwright MCP and TWD MCP configured), you can prompt:

> "Use Playwright to navigate to my app, click the login button, fill the form with test@example.com, then generate a TWD test from those actions"

**Note**: Playwright MCP executes actions programmatically based on your description—it doesn't manually record your browser interactions. You describe what should happen, and Playwright MCP executes those actions and captures the data.

The AI will:
1. Use Playwright MCP to:
   - Navigate to the URL
   - Execute the described actions (clicks, typing, navigation) programmatically
   - Capture DOM snapshots with accessibility tree data
   - Capture network requests/responses
2. Transform Playwright data to TWD MCP format
3. Call TWD MCP `generateTestFromRecording` tool with the interactions and network calls
4. Output a complete TWD test file ready to use

### Example Generated Output

```typescript
import { twd, userEvent, screenDom } from "twd-js";
import { describe, it, beforeEach } from "twd-js/runner";

describe("Login flow", () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
  });

  it("should complete the recorded flow", async () => {
    // Define mocks before interactions
    twd.mockRequest("LoginRequest", {
      method: "POST",
      url: "/api/login",
      response: { token: "abc123" },
      status: 200
    });

    await userEvent.click(screenDom.getByRole('button', { name: /login/i }));
    await userEvent.type(screenDom.getByLabelText(/email/i), 'user@example.com');
    // ... more interactions
  });
});
```
