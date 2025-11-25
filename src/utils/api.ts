export function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {};
  
  const sanitized = { ...headers };
  if ('x-api-key' in sanitized) {
    sanitized['x-api-key'] = '[REDACTED]';
  }
  return sanitized;
}