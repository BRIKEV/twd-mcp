import { z } from "zod";

// Element schema for selector suggestions
export const ElementSchema = z.object({
  tagName: z.string().describe("The HTML tag name (e.g., 'button', 'input', 'div')"),
  role: z.string().optional().describe("The ARIA role attribute"),
  textContent: z.string().optional().describe("Visible text content inside the element"),
  ariaLabel: z.string().optional().describe("The aria-label attribute"),
  placeholder: z.string().optional().describe("The placeholder attribute (for inputs)"),
  testId: z.string().optional().describe("The data-testid attribute"),
  name: z.string().optional().describe("The name attribute (for form elements)"),
});

// Interaction schema
export const InteractionSchema = z.object({
  type: z.enum(['click', 'type', 'navigate']).describe("The type of user interaction"),
  target: ElementSchema.describe("The target element for the interaction"),
  value: z.string().optional().describe("The text content for 'type' events"),
  url: z.string().optional().describe("The URL for 'navigate' events"),
  timestamp: z.number().optional().describe("Timestamp of the interaction"),
});

// Network request/response schema
export const NetworkRequestSchema = z.object({
  url: z.string().describe("The request URL"),
  method: z.string().describe("The HTTP method (GET, POST, etc.)"),
  response: z.object({
    status: z.number().optional().describe("HTTP status code"),
    body: z.any().describe("Response body (can be any JSON-serializable value)"),
  }).describe("The response data"),
});

// Input schemas for tools
export const SuggestSelectorsInputSchema = ElementSchema;

export const GenerateMocksFromNetworkInputSchema = z.object({
  requests: z.array(NetworkRequestSchema).describe("Array of captured network requests"),
});

export const GenerateTestFromRecordingInputSchema = z.object({
  interactions: z.array(InteractionSchema).describe("Array of user interactions captured from browser"),
  networkCalls: z.array(NetworkRequestSchema).optional().describe("Optional array of network requests to mock"),
  testName: z.string().optional().describe("Name for the generated test (defaults to 'recorded user flow')"),
});

// Output schemas
export const SelectorSuggestionSchema = z.object({
  selector: z.string().describe("The testing-library selector code"),
  priority: z.number().describe("Priority (lower is better)"),
  type: z.enum(['role', 'text', 'label', 'placeholder', 'testid']).describe("The type of selector"),
});

export type Element = z.infer<typeof ElementSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type NetworkRequest = z.infer<typeof NetworkRequestSchema>;
export type SelectorSuggestion = z.infer<typeof SelectorSuggestionSchema>;

