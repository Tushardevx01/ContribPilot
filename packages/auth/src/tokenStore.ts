import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import type { AuthToken, UserProfile } from './index.js';

let keytarInstance: typeof import('keytar') | null | undefined = undefined;

async function loadKeytar(): Promise<typeof import('keytar') | null> {
  if (keytarInstance !== undefined) return keytarInstance;
  try {
    const mod = await import('keytar');
    keytarInstance = mod.default || mod;
    return keytarInstance;
  } catch {
    keytarInstance = null;
    return null;
  }
}

const SERVICE_NAME = 'contribpilot';
const KEY_ACCESS_TOKEN = 'google_access_token';
const KEY_REFRESH_TOKEN = 'google_refresh_token';
const KEY_ID_TOKEN = 'google_id_token';
const KEY_EXPIRES_AT = 'google_token_expires_at';
const KEY_GEMINI_API = 'gemini_api_key';
const KEY_GITHUB_TOKEN = 'github_pat_token';
const KEY_PRO_LICENSE = 'pro_license_key';
const KEY_GROQ_API = 'groq_api_key';
const KEY_USER_PROFILE = 'user_profile';

/**
 * TokenStore manages persistent authentication tokens and API keys.
 *
 * Security Architecture:
 * 1. Primary: Native OS Keychain via `keytar` (macOS Keychain, Windows Credential Manager, Linux Secret Service / libsecret).
 * 2. Fallback: AES-256-GCM encrypted file storage (`vault.dat`).
 *    - Keys are generated using cryptographically strong random entropy (256-bit `crypto.randomBytes(32)`), stored with restricted POSIX permissions (0600).
 *    - Or derived via PBKDF2 (100,000 iterations of HMAC-SHA256) when an environment master key (`CONTRIBPILOT_VAULT_KEY` or `CONTRIBPILOT_MASTER_KEY`) is specified.
 *    - Avoids predictable keys derived from username and hardcoded strings.
 *    - Automatically migrates legacy vaults encrypted with older predictable keys.
 *
 * Security Limitations of Fallback Storage:
 * - File-based encrypted fallback relies on OS-level filesystem permissions (mode 0700 for directories, 0600 for files).
 * - It protects against other unprivileged user accounts on the same system and offline disk inspection if unmounted.
 * - It CANNOT defend against processes executing under the same user UID, elevated root accounts, or compromised local runtimes.
 * - For production deployments, operating systems with native credential managers (keychain/secret service) should be preferred.
 */
export class TokenStore {
  private fallbackDir: string;
  private fallbackFile: string;
  private keyFile: string;
  private saltFile: string;
  private cachedKey: Buffer | null = null;
  private isKeytarAvailable = true;

  constructor(customDir?: string, options?: { forceFallback?: boolean }) {
    this.fallbackDir = customDir || path.join(os.homedir(), '.contribpilot');
    this.fallbackFile = path.join(this.fallbackDir, 'vault.dat');
    this.keyFile = path.join(this.fallbackDir, '.vault.key');
    this.saltFile = path.join(this.fallbackDir, '.vault.salt');
    if (options?.forceFallback) {
      this.isKeytarAvailable = false;
    }
    this.ensureDir();
  }

  private ensureDir(): void {
    try {
      if (!fs.existsSync(this.fallbackDir)) {
        fs.mkdirSync(this.fallbackDir, { recursive: true, mode: 0o700 });
      } else {
        // Enforce 0700 permissions on existing directory if possible
        try {
          fs.chmodSync(this.fallbackDir, 0o700);
        } catch {
          // Ignore on platforms without POSIX chmod support (e.g. Windows)
        }
      }
    } catch {
      // Ignored
    }
  }

  /**
   * Derives or loads the AES-256 key for encrypted fallback storage.
   * Uses cryptographically secure random bytes or PBKDF2 derivation.
   */
  private getOrCreateFallbackKey(): Buffer {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    this.ensureDir();

    // Check if user provided an explicit master key via environment variable
    const envMasterKey = process.env.CONTRIBPILOT_VAULT_KEY || process.env.CONTRIBPILOT_MASTER_KEY;
    if (envMasterKey) {
      let salt: Buffer;
      if (fs.existsSync(this.saltFile)) {
        salt = fs.readFileSync(this.saltFile);
      } else {
        salt = crypto.randomBytes(16);
        fs.writeFileSync(this.saltFile, salt, { mode: 0o600 });
      }
      this.cachedKey = crypto.pbkdf2Sync(envMasterKey, salt, 100000, 32, 'sha256');
      return this.cachedKey;
    }

    // Check if secure key file already exists
    if (fs.existsSync(this.keyFile)) {
      try {
        const key = fs.readFileSync(this.keyFile);
        if (key.length === 32) {
          this.cachedKey = key;
          return this.cachedKey;
        }
      } catch {
        // Fall through to regenerate
      }
    }

    // If vault exists but key file doesn't, check for legacy vault migration
    if (fs.existsSync(this.fallbackFile) && !fs.existsSync(this.keyFile)) {
      const migrated = this.attemptLegacyMigration();
      if (migrated) {
        return this.cachedKey!;
      }
    }

    // Generate new high-entropy 256-bit random key
    const newKey = crypto.randomBytes(32);
    try {
      fs.writeFileSync(this.keyFile, newKey, { mode: 0o600 });
      try {
        fs.chmodSync(this.keyFile, 0o600);
      } catch {
        // Ignore chmod on unsupported filesystems
      }
    } catch {
      // If writing fails, still keep in memory for process lifetime
    }

    this.cachedKey = newKey;
    return this.cachedKey;
  }

  /**
   * Migrates older vaults encrypted with the legacy username-based predictable key.
   */
  private attemptLegacyMigration(): boolean {
    try {
      const legacyKey = crypto
        .createHash('sha256')
        .update(os.userInfo().username + '_cp_salt')
        .digest();
      const raw = fs.readFileSync(this.fallbackFile, 'utf8');
      const [ivHex, tagHex, encryptedHex] = raw.split(':');
      if (!ivHex || !tagHex || !encryptedHex) return false;

      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', legacyKey, iv);
      decipher.setAuthTag(tag);
      let dec = decipher.update(encryptedHex, 'hex', 'utf8');
      dec += decipher.final('utf8');
      const data: Record<string, string> = JSON.parse(dec);

      // Successfully decrypted legacy data! Generate a new high-entropy key and re-encrypt
      const newKey = crypto.randomBytes(32);
      fs.writeFileSync(this.keyFile, newKey, { mode: 0o600 });
      this.cachedKey = newKey;
      this.writeFallback(data);
      return true;
    } catch {
      return false;
    }
  }

  private readFallback(): Record<string, string> {
    this.ensureDir();
    if (!fs.existsSync(this.fallbackFile)) return {};
    try {
      const key = this.getOrCreateFallbackKey();
      const raw = fs.readFileSync(this.fallbackFile, 'utf8');
      const [ivHex, tagHex, encryptedHex] = raw.split(':');
      if (!ivHex || !tagHex || !encryptedHex) return {};
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      let dec = decipher.update(encryptedHex, 'hex', 'utf8');
      dec += decipher.final('utf8');
      return JSON.parse(dec);
    } catch {
      return {};
    }
  }

  private writeFallback(data: Record<string, string>): void {
    this.ensureDir();
    const key = this.getOrCreateFallbackKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let enc = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const payload = `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
    fs.writeFileSync(this.fallbackFile, payload, { mode: 0o600 });
    try {
      fs.chmodSync(this.fallbackFile, 0o600);
    } catch {
      // Ignore chmod on unsupported filesystems
    }
  }

  /**
   * Reports whether storage is using the native keychain or encrypted fallback.
   */
  async getStorageMethod(): Promise<'keychain' | 'encrypted_fallback'> {
    if (this.isKeytarAvailable) {
      try {
        const kt = await loadKeytar();
        if (kt) return 'keychain';
      } catch {
        // Fall through
      }
    }
    return 'encrypted_fallback';
  }

  async setSecret(account: string, value: string): Promise<void> {
    if (this.isKeytarAvailable) {
      try {
        const kt = await loadKeytar();
        if (kt) {
          await kt.setPassword(SERVICE_NAME, account, value);
          return;
        }
        this.isKeytarAvailable = false;
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    store[account] = value;
    this.writeFallback(store);
  }

  async getSecret(account: string): Promise<string | null> {
    if (this.isKeytarAvailable) {
      try {
        const kt = await loadKeytar();
        if (kt) {
          const val = await kt.getPassword(SERVICE_NAME, account);
          if (val) return val;
        } else {
          this.isKeytarAvailable = false;
        }
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    return store[account] ?? null;
  }

  async deleteSecret(account: string): Promise<boolean> {
    if (this.isKeytarAvailable) {
      try {
        const kt = await loadKeytar();
        if (kt) {
          return await kt.deletePassword(SERVICE_NAME, account);
        }
        this.isKeytarAvailable = false;
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    if (account in store) {
      delete store[account];
      this.writeFallback(store);
      return true;
    }
    return false;
  }

  async setToken(token: AuthToken): Promise<void> {
    await this.setSecret(KEY_ACCESS_TOKEN, token.accessToken);
    if (token.refreshToken) await this.setSecret(KEY_REFRESH_TOKEN, token.refreshToken);
    if (token.idToken) await this.setSecret(KEY_ID_TOKEN, token.idToken);
    await this.setSecret(KEY_EXPIRES_AT, String(token.expiresAt));
  }

  async getToken(): Promise<AuthToken | null> {
    const accessToken = await this.getSecret(KEY_ACCESS_TOKEN);
    if (!accessToken) return null;
    const refreshToken = (await this.getSecret(KEY_REFRESH_TOKEN)) ?? undefined;
    const idToken = (await this.getSecret(KEY_ID_TOKEN)) ?? undefined;
    const expiresAtStr = await this.getSecret(KEY_EXPIRES_AT);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : Date.now() + 3600 * 1000;
    return { accessToken, refreshToken, idToken, expiresAt };
  }

  async clearToken(): Promise<void> {
    await this.deleteSecret(KEY_ACCESS_TOKEN);
    await this.deleteSecret(KEY_REFRESH_TOKEN);
    await this.deleteSecret(KEY_ID_TOKEN);
    await this.deleteSecret(KEY_EXPIRES_AT);
    await this.deleteSecret(KEY_USER_PROFILE);
  }

  private getAccountForProvider(provider: 'gemini' | 'github' | 'pro' | 'groq'): string {
    switch (provider) {
      case 'gemini':
        return KEY_GEMINI_API;
      case 'github':
        return KEY_GITHUB_TOKEN;
      case 'pro':
        return KEY_PRO_LICENSE;
      case 'groq':
        return KEY_GROQ_API;
    }
  }

  async setApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq', key: string): Promise<void> {
    const account = this.getAccountForProvider(provider);
    await this.setSecret(account, key);
  }

  async getApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq'): Promise<string | null> {
    const account = this.getAccountForProvider(provider);
    return await this.getSecret(account);
  }

  async deleteApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq'): Promise<void> {
    const account = this.getAccountForProvider(provider);
    await this.deleteSecret(account);
  }

  async isProUser(): Promise<boolean> {
    const key = await this.getApiKey('pro');
    return !!key && key.trim().length > 0;
  }

  async setUserProfile(profile: UserProfile): Promise<void> {
    await this.setSecret(KEY_USER_PROFILE, JSON.stringify(profile));
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await this.getSecret(KEY_USER_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const defaultTokenStore = new TokenStore();
