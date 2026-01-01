import { Interaction, NetworkRequest } from "../schemas.js";
import { suggestSelectors } from "./suggestSelectors.js";
import { generateMocksFromNetwork } from "./generateMocksFromNetwork.js";

/**
 * Generates a complete TWD test file from browser recording data
 */
export function generateTestFromRecording(input: {
  interactions: Interaction[];
  networkCalls?: NetworkRequest[];
  testName?: string;
}): string {
  const { interactions, networkCalls = [], testName = 'recorded user flow' } = input;
  
  const lines: string[] = [];
  
  // Generate imports - TWD uses twd-js and twd-js/runner
  lines.push(`import { twd, userEvent, screenDom } from "twd-js";`);
  lines.push(`import { describe, it, beforeEach } from "twd-js/runner";`);
  lines.push('');
  
  // Generate test structure
  lines.push(`describe("${testName}", () => {`);
  lines.push(`  beforeEach(() => {`);
  lines.push(`    // Clear mocks before each test`);
  lines.push(`    twd.clearRequestMockRules();`);
  lines.push(`  });`);
  lines.push('');
  lines.push(`  it("should complete the recorded flow", async () => {`);
  
  // Generate mocks BEFORE interactions (TWD requirement)
  // Mocks should be defined before the action that triggers them
  if (networkCalls.length > 0) {
    lines.push(`    // Define mocks before interactions`);
    const mockLines = generateMocksFromNetwork(networkCalls)
      .split('\n')
      .map(line => `    ${line}`)
      .join('\n');
    lines.push(mockLines);
    lines.push('');
  }
  
  // Generate interaction steps
  for (const interaction of interactions) {
    // Note: TWD doesn't have a visit() function - navigation is typically
    // handled by the test setup or the application itself
    if (interaction.type === 'navigate') {
      if (interaction.url) {
        lines.push(`    // Navigate to: ${interaction.url}`);
        lines.push(`    // Note: Navigation may need to be handled in test setup`);
      }
      continue;
    }
    
    const suggestions = suggestSelectors(interaction.target);
    const selector = suggestions[0]?.selector;
    
    if (!selector) {
      // Skip if no selector can be generated
      lines.push(`    // TODO: Could not generate selector for ${interaction.type} on ${interaction.target.tagName}`);
      continue;
    }
    
    switch (interaction.type) {
      case 'click':
        lines.push(`    await userEvent.click(${selector});`);
        break;
      case 'type':
        if (interaction.value) {
          // Escape single quotes in the value
          const escapedValue = interaction.value.replace(/'/g, "\\'");
          lines.push(`    await userEvent.type(${selector}, '${escapedValue}');`);
        }
        break;
    }
  }
  
  // Add a basic assertion placeholder
  lines.push('');
  lines.push(`    // TODO: Add assertions`);
  lines.push(`    // const message = await twd.get(".message");`);
  lines.push(`    // message.should("be.visible");`);
  
  lines.push(`  });`);
  lines.push(`});`);
  
  return lines.join('\n');
}

