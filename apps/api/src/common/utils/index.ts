import { SENSITIVE_KEYS } from '../../constants';

//  Recursively redact sensitive fields from the request body before logging.
export function sanitiseBody(body: unknown, depth = 0): unknown {
  if (depth > 5 || body === null || typeof body !== 'object') return body;

  if (Array.isArray(body)) {
    return body.map((item) => sanitiseBody(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitiseBody(value, depth + 1);
    }
  }
  return sanitized;
}

// Prevent massive payloads (e.g. file uploads, large lists) from flooding
// the logs. Serialises the response and caps it at MAX_CHARS characters.

export function truncate(data: unknown, maxChars = 500) {
  try {
    const serialised = JSON.stringify(data);
    if (serialised.length <= maxChars) return data;
    return `${serialised.slice(0, maxChars)}… [truncated ${serialised.length - maxChars} chars]`;
  } catch {
    return '[unserializable]';
  }
}
