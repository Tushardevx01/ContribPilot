import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { generatePKCE, TokenStore } from '../src/index.js';

describe('OAuth PKCE', () => {
  it('generates valid code verifier and challenge', () => {
    const pkce = generatePKCE();
    expect(pkce.verifier).toBeDefined();
    expect(pkce.challenge).toBeDefined();
    expect(pkce.verifier.length).toBeGreaterThan(20);
    expect(pkce.challenge.length).toBeGreaterThan(20);
  });
});

describe('TokenStore', () => {
  const testDir = path.join(process.cwd(), '.tmp-auth-test');
  const store = new TokenStore(testDir);

  afterAll(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignored
    }
  });

  it('can store, retrieve, and delete secrets', async () => {
    await store.setApiKey('gemini', 'test_gemini_key_12345');
    const retrieved = await store.getApiKey('gemini');
    expect(retrieved).toBe('test_gemini_key_12345');

    await store.deleteApiKey('gemini');
    const afterDelete = await store.getApiKey('gemini');
    expect(afterDelete).toBeNull();
  });

  it('can store and clear auth token', async () => {
    await store.setToken({
      accessToken: 'access_123',
      refreshToken: 'refresh_123',
      expiresAt: Date.now() + 10000,
    });
    const token = await store.getToken();
    expect(token?.accessToken).toBe('access_123');
    expect(token?.refreshToken).toBe('refresh_123');

    await store.clearToken();
    const cleared = await store.getToken();
    expect(cleared).toBeNull();
  });
});
