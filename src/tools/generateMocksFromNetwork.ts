import { NetworkRequest } from "../schemas.js";

/**
 * Generates TWD mock request calls from captured network requests
 * Each mock is generated as a separate twd.mockRequest() call
 */
export function generateMocksFromNetwork(requests: NetworkRequest[]): string {
  if (requests.length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push('// Generated mock handlers');
  
  requests.forEach((req, index) => {
    try {
      const url = new URL(req.url);
      const pathname = url.pathname;
      const method = req.method.toUpperCase();
      
      // Generate alias from URL path
      const aliasFromPath = pathname
        .split('/')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/[^a-zA-Z0-9]/g, ''))
        .join('')
        .substring(0, 20) || `request${index + 1}`;

      const responseBody = JSON.stringify(req.response.body, null, 2);
      const status = req.response.status || 200;

      lines.push(`twd.mockRequest("${aliasFromPath}", {`);
      lines.push(`  method: "${method}",`);
      lines.push(`  url: "${pathname}",`);
      lines.push(`  response: ${responseBody},`);
      lines.push(`  status: ${status}`);
      lines.push(`});`);
      if (index < requests.length - 1) {
        lines.push('');
      }
    } catch (error) {
      // Skip invalid URLs
      console.error(`Skipping invalid request: ${req.url}`, error);
    }
  });
  
  return lines.join('\n');
}

