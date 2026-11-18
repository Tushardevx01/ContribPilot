import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
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

  it('generates high-entropy non-predictable keys for fallback storage', async () => {
    const dir1 = path.join(process.cwd(), '.tmp-auth-vault1');
    const dir2 = path.join(process.cwd(), '.tmp-auth-vault2');

    try {
      const store1 = new TokenStore(dir1, { forceFallback: true });
      const store2 = new TokenStore(dir2, { forceFallback: true });

      await store1.setApiKey('groq', 'key_store_1');
      await store2.setApiKey('groq', 'key_store_2');

      const keyFile1 = path.join(dir1, '.vault.key');
      const keyFile2 = path.join(dir2, '.vault.key');

      expect(fs.existsSync(keyFile1)).toBe(true);
      expect(fs.existsSync(keyFile2)).toBe(true);

      const key1 = fs.readFileSync(keyFile1);
      const key2 = fs.readFileSync(keyFile2);

      // Keys must be 32 bytes (256-bit AES) and cryptographically distinct
      expect(key1.length).toBe(32);
      expect(key2.length).toBe(32);
      expect(key1.equals(key2)).toBe(false);

      // Must not match legacy predictable hash
      const predictableLegacyKey = crypto
        .createHash('sha256')
        .update(os.userInfo().username + '_cp_salt')
        .digest();
      expect(key1.equals(predictableLegacyKey)).toBe(false);
      expect(key2.equals(predictableLegacyKey)).toBe(false);
    } finally {
      fs.rmSync(dir1, { recursive: true, force: true });
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });

  it('migrates legacy predictable vaults transparently', async () => {
    const legacyDir = path.join(process.cwd(), '.tmp-legacy-vault');
    try {
      fs.mkdirSync(legacyDir, { recursive: true, mode: 0o700 });
      const legacyKey = crypto
        .createHash('sha256')
        .update(os.userInfo().username + '_cp_salt')
        .digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, iv);
      const legacyData = { gemini_api_key: 'migrated_secret_value_123' };
      let enc = cipher.update(JSON.stringify(legacyData), 'utf8', 'hex');
      enc += cipher.final('hex');
      const tag = cipher.getAuthTag();
      fs.writeFileSync(
        path.join(legacyDir, 'vault.dat'),
        `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`
      );

      const migratingStore = new TokenStore(legacyDir, { forceFallback: true });
      const secret = await migratingStore.getApiKey('gemini');
      expect(secret).toBe('migrated_secret_value_123');

      // Check that a new secure .vault.key was generated
      const keyPath = path.join(legacyDir, '.vault.key');
      expect(fs.existsSync(keyPath)).toBe(true);
      const generatedKey = fs.readFileSync(keyPath);
      expect(generatedKey.length).toBe(32);
      expect(generatedKey.equals(legacyKey)).toBe(false);
    } finally {
      fs.rmSync(legacyDir, { recursive: true, force: true });
    }
  });
});
