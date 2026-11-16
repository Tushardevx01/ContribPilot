const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /disregard\s+(above|all)/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
];

// Zero-width characters often used for obfuscation / injection
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u202A-\u202E]/g;

export function sanitizePromptInput(input: string): {
  sanitized: string;
  flagged: boolean;
  reason?: string;
} {
  let cleaned = input.replace(ZERO_WIDTH_REGEX, '');

  let flagged = false;
  let reason: string | undefined;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      flagged = true;
      reason = `Potential prompt injection pattern detected: ${pattern.toString()}`;
      break;
    }
  }

  return { sanitized: cleaned, flagged, reason };
}
