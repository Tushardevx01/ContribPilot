import { describe, it, expect } from 'vitest';
import { redactSecrets, AuthError, RateLimitError, PolicyBlockedError } from '../src/index.js';

describe('redactSecrets', () => {
  it('redacts GitHub Personal Access Tokens and OAuth tokens', () => {
    const input = 'Error with token ghp_1234567890abcdefghijklmnopqrstuvwxyz123456';
    expect(redactSecrets(input)).toBe('Error with token [REDACTED_SECRET]');
  });

  it('redacts Google API keys', () => {
    const input = 'Using key AIzaSyD1234567890abcdefghijklmnopqrstuv';
    expect(redactSecrets(input)).toBe('Using key [REDACTED_SECRET]');
  });

  it('redacts Bearer tokens', () => {
    const input = 'Authorization: Bearer my-secret-bearer-token-12345';
    expect(redactSecrets(input)).toBe('Authorization: [REDACTED_SECRET]');
  });
});

describe('Typed Errors', () => {
  it('returns proper exit codes', () => {
    expect(new AuthError('Not logged in').exitCode).toBe(2);
    expect(new RateLimitError('Rate limited').exitCode).toBe(3);
    expect(new PolicyBlockedError('Banned').exitCode).toBe(6);
  });
});
